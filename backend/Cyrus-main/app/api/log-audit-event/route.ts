import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * API Route: /api/log-audit-event
 * Logs forensic events to the audit_history table for a specific assessment.
 */
export async function POST(req: Request) {
    const supabase = await createClient();
    
    // Check for admin role or service role (from n8n)
    const { data: { user } } = await supabase.auth.getUser();
    
    // In a real production app, we would also verify service_role key for n8n.
    // For now, we allow authenticated users (checked via RLS in migration_v10)
    
    try {
        const { assessmentId, eventType, description, payload } = await req.json();

        if (!assessmentId || !eventType || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("audit_history")
            .insert({
                assessment_id: assessmentId,
                actor_id: user?.id,
                event_type: eventType,
                description: description,
                payload: payload || {}
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, event: data });

    } catch (err: any) {
        console.error("[Audit Log Error]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
