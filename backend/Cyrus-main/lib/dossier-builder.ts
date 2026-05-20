import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { CompanyDossier } from "./company-data";
import { gatherShodanIntelligence, ShodanFinds } from "./shodan-engine";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set. Dossier generation will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

const dossierSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        name: { type: SchemaType.STRING, description: "Full official name of the organization" },
        founded: { type: SchemaType.STRING, description: "Year founded or established" },
        hq: { type: SchemaType.STRING, description: "Headquarters location (City, Country)" },
        leadership: { type: SchemaType.STRING, description: "Key leadership (CEO, Founder, Board Chair)" },
        legacy: { type: SchemaType.STRING, description: "Detailed paragraph about history, evolution, and market position" },
        portfolio: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Core Products & Services" },
        description: { type: SchemaType.STRING, description: "Comprehensive business description" },
        website: { type: SchemaType.STRING, description: "Website URL" },
        businessModel: { type: SchemaType.STRING, description: "Detailed Business & Revenue Model" },
        employees: { type: SchemaType.STRING, description: "Precise or estimated employee count" },
        annualRevenue: { type: SchemaType.STRING, description: "Revenue with currency and scale (e.g. $4.2B USD)" },
        operationalReach: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Specific countries and regions of operation" },
        industriesServed: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Primary and secondary industries" },
        notableClients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Strategic clients and partners" },
        subsidiaries: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Key subsidiaries and acquisitions" },
        keyCompetitors: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Primary market competitors" },
        revenueStreams: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    label: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                    percentage: { type: SchemaType.NUMBER, description: "Estimated percentage of total revenue (must sum to 100)" }
                },
                required: ["label", "description", "percentage"]
            },
            description: "Detailed revenue breakdown"
        },
        keyMilestones: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    year: { type: SchemaType.STRING },
                    event: { type: SchemaType.STRING }
                },
                required: ["year", "event"]
            },
            description: "Significant corporate milestones"
        },
        digitalAssets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Critical digital assets and IP" },
        cloudInfrastructure: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Cloud providers and regional footprint" },
        complianceFrameworks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Compliance standards followed (ISO, SOC2, GDPR, etc.)" },
        recentSecurityIncidents: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    year: { type: SchemaType.STRING },
                    title: { type: SchemaType.STRING },
                    impact: { type: SchemaType.STRING }
                },
                required: ["year", "title", "impact"]
            },
            description: "Known security events or data breaches"
        },
        supplyChainExposure: { type: SchemaType.STRING, description: "Analysis of third-party risk and vendor dependencies" },
        regulatoryEnvironment: { type: SchemaType.STRING, description: "Relevant laws and regulations impacting their operations" },
        cyberThreatNarrative: { type: SchemaType.STRING, description: "Analysis of the specific threat landscape for this entity" },
        cyberStats: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    label: { type: SchemaType.STRING },
                    value: { type: SchemaType.NUMBER },
                    reasoning: { type: SchemaType.STRING }
                },
                required: ["label", "value", "reasoning"]
            },
            description: "Quantified risk metrics (0-100)"
        },
        shodanIntelligence: {
            type: SchemaType.OBJECT,
            properties: {
                assetCount: { type: SchemaType.NUMBER },
                openPorts: { 
                    type: SchemaType.ARRAY, 
                    items: { 
                        type: SchemaType.OBJECT,
                        properties: {
                            port: { type: SchemaType.NUMBER },
                            risk: { type: SchemaType.STRING }
                        },
                        required: ["port", "risk"]
                    } 
                },
                vulnerabilities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                techStack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                lastScanDate: { type: SchemaType.STRING }
            },
            description: "OSINT reconnaissance data"
        }
    },
    required: [
        "name", "founded", "hq", "leadership", "legacy", "portfolio", "description", 
        "businessModel", "employees", "annualRevenue", "operationalReach", 
        "industriesServed", "notableClients", "revenueStreams", "keyMilestones", 
        "digitalAssets", "supplyChainExposure", "regulatoryEnvironment", 
        "cyberThreatNarrative", "cyberStats", "cloudInfrastructure", 
        "complianceFrameworks"
    ]
};

export async function buildDynamicDossier(organizationName: string, websiteUrl?: string): Promise<CompanyDossier> {
    if (!apiKey) throw new Error("No API Key");

    let shodanPrompt = "";
    if (websiteUrl) {
        const shodanRecon = await gatherShodanIntelligence(websiteUrl);
        if (shodanRecon) {
            shodanPrompt = `OSINT: ${shodanRecon.rawReport}`;
        }
    }

    const safetySettings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];

    const searchModel = genAI.getGenerativeModel({
        model: "gemini-3.1-pro-preview", // Elite 2026 Model
        tools: [{ googleSearch: {} }] as any,
        safetySettings: safetySettings as any
    });

    const extractionModel = genAI.getGenerativeModel({
        model: "gemini-3.1-pro-preview", 
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: dossierSchema,
            temperature: 0.1,
        },
        safetySettings: safetySettings as any
    });

    const researchPrompt = `
        You are a Tier-1 Forensic Cyber Underwriter specializing in OSINT and corporate intelligence.
        Perform an exhaustive, deep-dive synthesis for: "${organizationName}".
        ${websiteUrl ? `Primary URL: ${websiteUrl}` : ''}
        ${shodanPrompt}

        RESEARCH PROTOCOL:
        1. **Identity & Governance**: Identify exact incorporation year, HQ city/state, and full executive leadership team (CEO, CFO, CTO, Board).
        2. **Financial Forensic**: Find the most recent annual revenue figures, funding rounds, or market capitalization. Use specific numbers (e.g. "$12.4 Billion USD").
        3. **Operational Scale**: Detail key subsidiaries, major acquisitions, and specific geographical markets.
        4. **Technological Footprint**: Identify their cloud service providers (AWS, Azure, GCP), key SaaS tools, and compliance certifications (SOC2, ISO27001, HIPAA).
        5. **Risk Analysis**: Research any past data breaches, ransomware incidents, or major regulatory fines.
        6. **Supply Chain**: Identify critical third-party dependencies (e.g. SAP, Salesforce, Oracle) and vendor risk exposure.
        7. **Cyber Threat Landscape**: Synthesize the specific threat actors (APTs) targeting this sector and the entity's inherent digital vulnerabilities.

        REQUIRED STANDARDS:
        - **ABSOLUTELY NO N/A**: If data is hidden, use industry benchmarks and competitive analysis to provide a high-confidence "Intelligence Estimate".
        - **Density**: The output must be rich with specific names, numbers, and technical details.
        - **Tone**: Clinical, authoritative, and data-driven.

        Format as a deep-dive, professional intelligence briefing for an executive risk committee.
    `;

    try {
        console.log(`[Dossier Builder] Step 1: Initiating Forensics for ${organizationName}...`);
        let searchResponse = "";
        try {
            const searchResult = await searchModel.generateContent(researchPrompt);
            searchResponse = searchResult.response.text();
        } catch (searchErr: any) {
            console.warn("[Dossier Builder] Search-grounded research failed. Falling back to Internal Knowledge Synthesis.");
            // FALLBACK: Use Pro model without search tool
            const internalModel = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
            const internalResult = await internalModel.generateContent(researchPrompt + "\n\nNOTE: Google Search is unavailable. Use your internal training data to provide the most accurate intelligence possible.");
            searchResponse = internalResult.response.text();
        }

        if (!searchResponse || searchResponse.length < 100) {
            throw new Error("Research yielded insufficient data.");
        }

        console.log(`[Dossier Builder] Step 2: Extracting high-fidelity JSON...`);
        const extractionPrompt = `
            You are a senior data engineer. Extract JSON from this briefing.
            
            CRITICAL RULE: YOU MUST NOT USE "N/A" OR "Unknown". 
            If the briefing is missing a field like 'founded' or 'hq', use your internal training data or market averages to fill it with the most accurate known information for "${organizationName}".
            Ensure exactly 4 items per array.
            
            [BRIEFING]
            ${searchResponse}
            [/BRIEFING]
        `;

        const extractionResult = await extractionModel.generateContent(extractionPrompt);
        const jsonText = extractionResult.response.text();
        
        // Clean and Parse JSON
        let cleanedJsonText = jsonText.replace(/```json|```/g, "").trim();
        const firstBrace = cleanedJsonText.indexOf('{');
        if (firstBrace > 0) cleanedJsonText = cleanedJsonText.substring(firstBrace);
        const lastBrace = cleanedJsonText.lastIndexOf('}');
        if (lastBrace < cleanedJsonText.length - 1) cleanedJsonText = cleanedJsonText.substring(0, lastBrace + 1);

        const data: CompanyDossier = JSON.parse(cleanedJsonText);
        
        // Final Polish
        if (websiteUrl && !data.website) data.website = websiteUrl;
        if (!data.cloudInfrastructure || data.cloudInfrastructure.length === 0) data.cloudInfrastructure = ["AWS", "Azure", "SaaS Ecosystem"];
        if (!data.complianceFrameworks || data.complianceFrameworks.length === 0) data.complianceFrameworks = ["ISO 27001", "SOC2 Type II"];
        
        console.log(`[Dossier Builder] Synthesis Successful: ${data.name}`);
        return data;
    } catch (error: any) {
        console.error("AI Build Error:", error.message || error);
        throw error;
    }
}

export function getFallbackModel() {
    const safetySettings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];

    return genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite",
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
        },
        safetySettings: safetySettings as any
    });
}
