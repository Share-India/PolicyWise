-- MIGRATION V9: POLICY ANALYSIS
-- Description: Adds columns to policy_documents table to store AI-generated analysis.

-- 1. Add columns to policy_documents
ALTER TABLE public.policy_documents
ADD COLUMN IF NOT EXISTS analysis_result JSONB,
ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS analysis_error TEXT;

-- 2. Add comment for documentation
COMMENT ON COLUMN public.policy_documents.analysis_result IS 'AI-generated JSON analysis of the policy document.';
COMMENT ON COLUMN public.policy_documents.analysis_status IS 'Status of the AI analysis: pending, processing, completed, failed.';
COMMENT ON COLUMN public.policy_documents.analysis_error IS 'Error message if the AI analysis failed.';

-- 3. Enable RLS for all users to read their own analysis results
-- (Assuming standard RLS setup where users can read their own documents)
CREATE POLICY "Users can read their own policy analysis"
ON public.policy_documents FOR SELECT
USING (auth.uid() = user_id);
