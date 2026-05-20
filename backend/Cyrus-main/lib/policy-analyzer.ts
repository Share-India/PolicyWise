import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

// Define the response schema for Policy Analysis
const policyAnalysisSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        executiveSummary: { type: SchemaType.STRING, description: "A high-level summary of the policy's quality and coverage" },
        identifiedControls: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING, description: "The name of the security control (e.g. MFA)" },
                    status: { type: SchemaType.STRING, description: "Whether the control is 'Implemented', 'Partial', or 'Missing'" },
                    details: { type: SchemaType.STRING, description: "A short description of how the control is described in the policy" }
                },
                required: ["name", "status"]
            },
            description: "A list of critical security controls identified in the document"
        },
        complianceAlignment: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    standard: { type: SchemaType.STRING, description: "The compliance standard (e.g. NIST, ISO 27001, GDPR)" },
                    alignmentScore: { type: SchemaType.NUMBER, description: "Estimated alignment from 0-100" },
                    notes: { type: SchemaType.STRING, description: "Observations on how the policy aligns with this standard" }
                },
                required: ["standard", "alignmentScore"]
            },
            description: "How well the policy aligns with recognized industry standards"
        },
        maturityGaps: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Key security or documentation gaps identified in the policy"
        },
        recommendations: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    action: { type: SchemaType.STRING, description: "Specific action to take" },
                    priority: { type: SchemaType.STRING, description: "Priority level: Critical, High, Medium, Low" },
                    impact: { type: SchemaType.STRING, description: "Estimated impact on organizational risk" }
                },
                required: ["action", "priority", "impact"]
            },
            description: "Actionable recommendations to improve the organization's security posture"
        }
    },
    required: ["executiveSummary", "identifiedControls", "complianceAlignment", "maturityGaps", "recommendations"]
};

export interface PolicyAnalysisResult {
    executiveSummary: string;
    identifiedControls: Array<{ name: string; status: string; details?: string }>;
    complianceAlignment: Array<{ standard: string; alignmentScore: number; notes?: string }>;
    maturityGaps: string[];
    recommendations: Array<{ action: string; priority: string; impact: string }>;
}

/**
 * Analyzes a policy document using Gemini 2.0 Flash.
 * Supports PDF, DOCX, and Images.
 */
export async function analyzePolicyDocument(fileBuffer: Buffer, mimeType: string): Promise<PolicyAnalysisResult> {
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
        model: process.env.AI_MODEL || "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: policyAnalysisSchema,
            temperature: 0.1,
        },
        safetySettings: safetySettings as any
    });

    const prompt = `
        You are an elite Cyber Policy Underwriter and Security Auditor.
        Your task is to perform a deep technical analysis of the provided IT/Cyber Security Policy document.

        Instructions:
        1. Read the document thoroughly.
        2. Extract and classify identified security controls.
        3. Assess alignment with major standards like NIST CSF, ISO 27001, and SOC2.
        4. Identify critical documentation or security gaps.
        5. Provide high-impact recommendations to improve the policy and the underlying security posture.

        The analysis should be highly professional, objective, and actionable.
    `;

    try {
        const startTime = Date.now();
        console.log(`[Policy AI] Starting analysis for document (${mimeType}, ${fileBuffer.length} bytes)...`);

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: fileBuffer.toString("base64"),
                    mimeType: mimeType
                }
            }
        ]);

        const responseText = result.response.text();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (!responseText) {
            throw new Error("Gemini returned an empty response for policy analysis.");
        }

        console.log(`[Policy AI] Analysis completed in ${duration}s.`);
        return JSON.parse(responseText);
    } catch (error) {
        console.error("[Policy AI] Gemini error:", error);
        throw error;
    }
}
