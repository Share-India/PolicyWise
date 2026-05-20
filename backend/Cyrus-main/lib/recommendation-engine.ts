import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { ScoringResult } from "./scoring-engine";
import { CompanyDossier } from "./company-data";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set. Remediation generation will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export interface RemediationStep {
    domain: string;
    impact: "Critical" | "High" | "Moderate";
    action: string;
    rationale: string;
}

export interface RemediationPlan {
    executiveSummary: string;
    steps: RemediationStep[];
}

const remediationSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        executiveSummary: {
            type: SchemaType.STRING,
            description: "A professional, underwriter-focused summary of the organization's critical gaps and the necessary path to compliance/insurability."
        },
        steps: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    domain: { type: SchemaType.STRING, description: "The risk domain this recommendation addresses" },
                    impact: { type: SchemaType.STRING, description: "Critical, High, or Moderate priority" },
                    action: { type: SchemaType.STRING, description: "Specific, actionable security control to implement" },
                    rationale: { type: SchemaType.STRING, description: "Why this mitigates underwriting risk" }
                },
                required: ["domain", "impact", "action", "rationale"]
            },
            description: "A prioritized list of exactly 5 specific structural remediation steps."
        }
    },
    required: ["executiveSummary", "steps"]
};

export async function generateRemediationPlan(result: ScoringResult, dossier?: CompanyDossier | null): Promise<RemediationPlan> {
    if (!apiKey) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured.");
    }

    const safetySettings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: remediationSchema,
            temperature: 0.3, // Slight creativity for actionable writing
        },
        safetySettings: safetySettings as any
    });

    const failedKillersTexts = result.failedKillers.map(k => `- ${k.domain}: ${k.text}`).join("\n");
    const weakDomains = result.domainScores.filter(d => d.earnedScore < d.maxScore * 0.7)
        .sort((a, b) => (a.earnedScore / a.maxScore) - (b.earnedScore / b.maxScore))
        .map(d => `- ${d.domain} (${Math.round((d.earnedScore / d.maxScore) * 100)}%)`)
        .join("\n");

    const prompt = `
        You are an elite Cyber Insurance Underwriting AI and Risk Mitigation Expert.
        Generate a highly actionable Remediation Plan for the client.

        Client Information:
        ${dossier ? `Name: ${dossier.name}\nIndustry: ${dossier.industriesServed?.join(', ') || 'N/A'}\nProfile: ${dossier.description}\nBusiness Model: ${dossier.businessModel}` : 'Anonymous Client'}

        Assessment Results:
        Overall Score: ${result.totalScore.toFixed(2)}%
        Risk Tier: ${result.riskTier}
        
        Critical Failures (Killer Controls missed):
        ${failedKillersTexts || "None"}

        Lowest Performing Domains:
        ${weakDomains || "None"}

        Task:
        1. Write a brief executive summary explaining why their current posture is an underwriting concern (focus on the failed killers and weak domains).
        2. Provide exactly 5 highly specific, actionable remediation steps they must implement to improve their cyber risk profile.
        3. Prioritize 'Critical' actions for failed killer controls first, then 'High'/'Moderate' for the weak domains.
        4. Focus on structural, enterprise-grade mitigation (e.g., Zero Trust Architecture, EDR deployment, Multi-Factor Authentication enforcement, Vendor Risk Management processes). Avoid generic advice like "use strong passwords".
    `;

    try {
        const aiResult = await model.generateContent(prompt);
        const text = aiResult.response.text();

        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }

        const parsed = JSON.parse(text);
        
        // Robust validation for RemediationPlan
        const plan: RemediationPlan = {
            executiveSummary: parsed.executiveSummary || "Underwriting review recommended based on identified risks.",
            steps: Array.isArray(parsed.steps) ? parsed.steps : []
        };

        return plan;
    } catch (error) {
        console.error("Error generating Remediation Plan:", error);
        // Return a basic plan instead of crashing
        return {
            executiveSummary: "Strategic remediation needed. Manual review of failed controls and low-scoring domains is advised.",
            steps: []
        };
    }
}
