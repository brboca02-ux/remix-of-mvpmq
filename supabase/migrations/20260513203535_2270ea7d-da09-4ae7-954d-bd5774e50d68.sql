-- Add column to leads_import for quick access to partners list
ALTER TABLE public.leads_import 
ADD COLUMN IF NOT EXISTS socios JSONB DEFAULT '[]'::jsonb;

-- Create a dedicated table for partners if detailed tracking is needed later
CREATE TABLE IF NOT EXISTS public.lead_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads_import(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cargo TEXT,
    qualificacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_partners ENABLE ROW LEVEL SECURITY;

-- Simple policy for development (access to all for now as per current project pattern)
CREATE POLICY "Enable all access for now" ON public.lead_partners FOR ALL USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_lead_partners_lead_id ON public.lead_partners(lead_id);