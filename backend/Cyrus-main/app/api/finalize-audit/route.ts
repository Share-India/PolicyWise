import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { assessmentId, clientEmail } = await req.json();

        if (!assessmentId) {
            return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });
        }

        console.log(`[Finalize Audit] Triggering n8n master workflow for: ${assessmentId}`);
        
        // Priority: Environment Variable > Docker Internal DNS > Localhost Fallback
        const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || (process.env.NODE_ENV === 'production' ? "http://n8n:5678/webhook" : "http://localhost:5678/webhook");
        const N8N_ENDPOINT = `${N8N_BASE_URL}/finalize-audit`;

        const N8N_USER = process.env.N8N_USER || "admin";
        const N8N_PASS = process.env.N8N_PASSWORD || "CyrusAutomation123!";
        const authHeader = `Basic ${Buffer.from(`${N8N_USER}:${N8N_PASS}`).toString('base64')}`;

        const n8nResponse = await fetch(N8N_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({ 
                assessmentId,
                clientEmail
            })
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n Trigger Failed: ${n8nResponse.statusText}`);
        }

        return NextResponse.json({ success: true, message: "Finalization protocol initiated via n8n" });

    } catch (err: any) {
        console.error("[Finalize Audit Error]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
