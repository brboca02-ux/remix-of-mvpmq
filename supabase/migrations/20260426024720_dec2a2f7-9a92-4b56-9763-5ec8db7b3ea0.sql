-- Tabela de Oportunidades de Nicho
CREATE TABLE IF NOT EXISTS public.market_niche_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID, -- UUID genérico para linkar com sessões de análise
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    evidence TEXT NOT NULL,
    source_origin TEXT NOT NULL,
    confidence_score FLOAT DEFAULT 0.0,
    risk_level TEXT DEFAULT 'unknown', -- 'low', 'medium', 'high'
    next_step TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Auditoria de Evidências
CREATE TABLE IF NOT EXISTS public.niche_evidence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.market_niche_opportunities(id) ON DELETE CASCADE,
    raw_evidence_payload JSONB,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.market_niche_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niche_evidence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own niche opportunities"
ON public.market_niche_opportunities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own niche evidence logs"
ON public.niche_evidence_logs FOR SELECT
USING (auth.uid() = (SELECT user_id FROM public.market_niche_opportunities WHERE id = opportunity_id));

-- Índices
CREATE INDEX IF NOT EXISTS idx_niche_analysis ON public.market_niche_opportunities(analysis_id);
