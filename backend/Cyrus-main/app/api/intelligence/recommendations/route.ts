import { NextResponse } from "next/server";
import { generateRemediationPlan } from "@/lib/recommendation-engine";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { result, dossier } = body;

        if (!result) {
            return NextResponse.json(
                { error: "Assessment result is required." },
                { status: 400 }
            );
        }

        console.log(`[Remediation API] Generating dynamic remediation plan for: ${dossier?.name || 'Anonymous'}`);
        const remediationPlan = await generateRemediationPlan(result, dossier);
        
        return NextResponse.json(remediationPlan);
    } catch (error) {
        console.error("[Remediation API] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate remediation plan." },
            { status: 500 }
        );
    }
}
