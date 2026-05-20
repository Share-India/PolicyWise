import { createClient } from "@/lib/supabase/server";
import { analyzePolicyDocument } from "@/lib/policy-analyzer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { documentId } = await req.json();

    if (!documentId) {
        return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    try {
        // 1. Fetch document metadata
        const { data: document, error: dbError } = await supabase
            .from("policy_documents")
            .select("*")
            .eq("id", documentId)
            .single();

        if (dbError || !document) throw new Error(dbError?.message || "Document not found");

        // 2. Update status to 'processing'
        await supabase
            .from("policy_documents")
            .update({ analysis_status: "processing" })
            .eq("id", documentId);

        // Compute mimeType based on extension for n8n
        let mimeType = "application/pdf";
        if (document.file_name.endsWith(".docx")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (document.file_name.endsWith(".png")) mimeType = "image/png";
        else if (document.file_name.endsWith(".jpg") || document.file_name.endsWith(".jpeg")) mimeType = "image/jpeg";

        // 3. Trigger n8n Workflow
        // Priority: Environment Variable > Docker Internal DNS > Localhost Fallback
        const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || (process.env.NODE_ENV === 'production' ? "http://n8n:5678/webhook" : "http://localhost:5678/webhook");
        const N8N_ENDPOINT = `${N8N_BASE_URL}/analyze-policy`;

        const N8N_USER = process.env.N8N_USER || "admin";
        const N8N_PASS = process.env.N8N_PASSWORD || "CyrusAutomation123!";
        const authHeader = `Basic ${Buffer.from(`${N8N_USER}:${N8N_PASS}`).toString('base64')}`;

        console.log(`[Policy Analysis API] Triggering workflow for: ${document.file_name} at ${N8N_ENDPOINT}`);

        const n8nResponse = await fetch(N8N_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({ 
                documentId,
                file_path: document.file_path,
                mimeType: mimeType 
            })
        });

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            throw new Error(`n8n Trigger Failed (${n8nResponse.status}): ${errorText || n8nResponse.statusText}`);
        }

        console.log(`[n8n Analysis] Workflow triggered successfully for: ${document.file_name}`);
        return NextResponse.json({ success: true, message: "Analysis initiated via n8n" });

    } catch (err: any) {
        console.error("[AI Analysis Error]", err);
        
        // Update database with error status
        await supabase
            .from("policy_documents")
            .update({ 
                analysis_status: "failed", 
                analysis_error: err.message 
            })
            .eq("id", documentId);

        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
