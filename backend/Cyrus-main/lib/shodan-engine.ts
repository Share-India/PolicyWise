/**
 * Shodan Engine
 * Wraps the Shodan REST API to gather actionable OSINT on a target domain.
 */

export interface ShodanFinds {
    assetCount: number;
    openPorts: { port: number; risk: 'critical' | 'warning' | 'standard' }[];
    vulnerabilities: string[]; // CVEs
    techStack: string[]; // Web servers, DB versions, etc.
    rawReport: string; // A summarized string for the LLM
}

export async function gatherShodanIntelligence(websiteUrl: string): Promise<ShodanFinds | null> {
    const apiKey = process.env.SHODAN_API_KEY;

    if (!apiKey) {
        console.warn("[Shodan Engine] SHODAN_API_KEY is not configured in .env.local. Skipping OSINT.");
        return null;
    }

    try {
        // Strip https, http, www, and endpoints to get the raw domain
        const urlObj = new URL(!websiteUrl.startsWith('http') ? `https://${websiteUrl}` : websiteUrl);
        let domain = urlObj.hostname;
        if (domain.startsWith("www.")) {
            domain = domain.substring(4);
        }

        console.log(`[Shodan Engine] Initiating OSINT scan for domain: ${domain}`);

        // Call the broad host search endpoint
        let response = await fetch(`https://api.shodan.io/shodan/host/search?key=${apiKey}&query=hostname:${domain}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        let data = await response.json();

        if (data.error && data.error.includes("credits")) {
            console.warn("[Shodan Engine] API Credits Exhausted. Returning baseline empty report.");
            return {
                assetCount: 0,
                openPorts: [],
                vulnerabilities: [],
                techStack: [],
                rawReport: `[NOTICE] Shodan API credits are exhausted for this key. OSINT reconnaissance was skipped, but synthesis will continue using high-fidelity internal knowledge and competitive benchmarks.`
            };
        }

        // FALLBACK 1: Search by SSL Certificate Common Name if hostname search is sparse
        if (!data.matches || data.matches.length < 2) {
            console.log(`[Shodan Engine] Sparse results for hostname. Attempting SSL cert search...`);
            const sslResponse = await fetch(`https://api.shodan.io/shodan/host/search?key=${apiKey}&query=ssl.cert.subject.cn:${domain}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });
            if (sslResponse.ok) {
                const sslData = await sslResponse.json();
                if (sslData.matches && sslData.matches.length > (data.matches?.length || 0)) {
                    data = sslData;
                }
            }
        }

        // FALLBACK 2: Search by Org name (derived from domain)
        if (!data.matches || data.matches.length === 0) {
            const orgSeed = domain.split('.')[0];
            console.log(`[Shodan Engine] No results for domain. Attempting broad org search for: ${orgSeed}`);
            const orgResponse = await fetch(`https://api.shodan.io/shodan/host/search?key=${apiKey}&query=org:"${orgSeed}"`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });
            if (orgResponse.ok) {
                const orgData = await orgResponse.json();
                if (orgData.matches && orgData.matches.length > 0) {
                    data = orgData;
                }
            }
        }

        if (!data.matches || data.matches.length === 0) {
            console.log(`[Shodan Engine] Zero exposed assets found for ${domain} after all fallbacks.`);
            return {
                assetCount: 0,
                openPorts: [],
                vulnerabilities: [],
                techStack: [],
                rawReport: `Shodan reconnaissance yielded zero exposed external internet assets or vulnerabilities for ${domain}.`
            };
        }

        const matches = data.matches;
        const openPorts = new Set<number>();
        const vulns = new Set<string>();
        const techStack = new Set<string>();

        // We'll summarize the top critical findings to drop into Gemini
        let topAssetsSummary = "";

        matches.forEach((match: any, index: number) => {
            if (match.port) openPorts.add(match.port);
            
            // Extract standard vulnerabilities (CVE array)
            if (match.vulns) {
                Object.keys(match.vulns).forEach(cve => vulns.add(cve));
            }

            // Extract tech layer info (e.g. Apache, Nginx, IIS)
            if (match.product) techStack.add(match.product);
            if (match.version && match.product) techStack.add(`${match.product} ${match.version}`);

            // Build a mini technical raw string for the LLM up to 5 assets
            if (index < 5) {
                topAssetsSummary += `- IP: ${match.ip_str} | Port: ${match.port} | Protocol: ${match.transport} | Service: ${match.product || "Unknown"}\n`;
            }
        });

        // Add additional banners if we have vulns
        if (vulns.size > 0) {
            topAssetsSummary += `\n🚨 DETECTED CRITICAL CVEs:\n${Array.from(vulns).join(", ")}\n`;
        }

        const reportString = `
[SHODAN EXTENDED OSINT REPORT]
Target: ${domain}
Total Exposed Assets Found: ${data.total || matches.length}
Unique Open Ports Exposed: ${Array.from(openPorts).join(", ")}
Identified Technologies: ${Array.from(techStack).slice(0, 10).join(", ") || "None highly specific identified"}
Known Vulnerabilities (CVEs): ${vulns.size > 0 ? Array.from(vulns).join(", ") : "None specifically matched from banners"}

Sample Extracted Asset Footprint:
${topAssetsSummary}
[END SHODAN DATA]`;

        console.log(`[Shodan Engine] Successfully gathered ${matches.length} matches, found ${openPorts.size} open ports and ${vulns.size} CVEs.`);

        // Risk Categorization for UI
        const criticalPorts = [21, 22, 23, 135, 139, 445, 3389, 5900];
        const warningPorts = [80, 8080, 8443, 3306, 5432, 27017];

        return {
            assetCount: data.total || matches.length,
            openPorts: Array.from(openPorts).map(p => ({
                port: p,
                risk: criticalPorts.includes(p) ? 'critical' : warningPorts.includes(p) ? 'warning' : 'standard'
            })),
            vulnerabilities: Array.from(vulns).slice(0, 50), // Cap to prevent massive arrays
            techStack: Array.from(techStack),
            rawReport: reportString
        };

    } catch (error) {
        console.error("[Shodan Engine] Execution failure:", error);
        return null;
    }
}
