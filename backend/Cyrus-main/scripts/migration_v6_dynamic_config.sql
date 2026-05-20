-- MIGRATION V6: DYNAMIC RISK CONFIGURATION
-- Description: Adds tables for Industry-specific domain weights and seeding industrial data.

-- 1. Create Industries table
CREATE TABLE IF NOT EXISTS public.industries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Industry-Domain Weights table
-- This allows different industries to have different weights for the same domain.
CREATE TABLE IF NOT EXISTS public.industry_weights (
    id SERIAL PRIMARY KEY,
    industry_id TEXT REFERENCES public.industries(id) ON DELETE CASCADE,
    domain_id TEXT REFERENCES public.domains(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    UNIQUE(industry_id, domain_id)
);

-- 3. Enable RLS
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_weights ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Allow Public Read, Admin Write)
CREATE POLICY "Allow public read-only access to industries"
ON public.industries FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access to industry_weights"
ON public.industry_weights FOR SELECT USING (true);

-- NOTE: For seeding, you may need to use service_role or temporarily disable RLS
-- or add a specific policy for the seeding operation.

-- 5. Add Comments
COMMENT ON TABLE public.industries IS 'Master list of industries supported by the underwriting model.';
COMMENT ON TABLE public.industry_weights IS 'Maps industries to specific domain weights, overriding defaults.';

-- 6. Initial Seed (Placeholder)
-- These tables will be populated by the seed_model_v2.ts script once migrations are applied.
