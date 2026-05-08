-- Create table for market research reports
CREATE TABLE IF NOT EXISTS public.market_research_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input TEXT NOT NULL,
    normalized_intent JSONB,
    report JSONB NOT NULL,
    sources JSONB,
    errors JSONB,
    owner_user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_research_reports ENABLE ROW LEVEL SECURITY;

-- DEV_ONLY: policy temporária para uso single-user/dev sem login. Antes de vender/escalar, substituir por auth.uid().
CREATE POLICY "Allow public access for dev" 
ON public.market_research_reports 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add comment explaining the policy
COMMENT ON TABLE public.market_research_reports IS 'DEV_ONLY: policy temporária para uso single-user/dev sem login. Antes de vender/escalar, substituir por auth.uid().';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_market_research_reports') THEN
        CREATE TRIGGER set_updated_at_market_research_reports
        BEFORE UPDATE ON public.market_research_reports
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
