-- MIGRATION V10: ADMIN APPROVAL & INSTITUTIONAL AUDITING
-- Description: Adds columns for underwriting decisioning and a table for full forensic audit history.

-- 1. Add columns to assessments table
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' NOT NULL,
ADD COLUMN IF NOT EXISTS underwriter_notes TEXT,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for approval_status
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'assessments' AND constraint_name = 'assessments_status_check'
    ) THEN
        ALTER TABLE public.assessments 
        ADD CONSTRAINT assessments_status_check 
        CHECK (approval_status IN ('pending', 'approved', 'rejected', 'info_requested'));
    END IF;
END $$;

-- 2. Create Audit History table for high-fidelity forensics
CREATE TABLE IF NOT EXISTS public.audit_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- 'AI_ANALYSIS', 'ADMIN_DECISION', 'USER_UPDATE', 'DOCUMENT_UPLOAD'
    description TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Users can see audit history for their own assessments
CREATE POLICY "Users can view audit history for their own assessments"
ON public.audit_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.assessments a
        WHERE a.id = assessment_id AND a.user_id = auth.uid()
    )
);

-- Admins can view all audit history
CREATE POLICY "Admins can view all audit history"
ON public.audit_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Admins and n8n (service_role) can insert audit events
CREATE POLICY "Admins can insert audit events"
ON public.audit_history FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- 5. Comments
COMMENT ON COLUMN public.assessments.approval_status IS 'The official underwriting decision status.';
COMMENT ON COLUMN public.assessments.underwriter_notes IS 'Internal notes provided by the admin during approval/rejection.';
COMMENT ON TABLE public.audit_history IS 'Forensic log of all significant events during the life of an assessment.';

-- 6. Record the migration
INSERT INTO public.system_migrations (name, version)
VALUES ('migration_v10_audit_history', '1.0.0')
ON CONFLICT (name) DO NOTHING;
