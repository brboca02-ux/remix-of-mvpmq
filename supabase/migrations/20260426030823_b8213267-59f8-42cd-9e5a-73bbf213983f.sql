-- Tabela de Oportunidades Comerciais (Growth Layer)
CREATE TABLE IF NOT EXISTS public.commercial_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    opportunity_score FLOAT DEFAULT 0.0,
    opportunity_level TEXT DEFAULT 'cold', -- 'hot', 'medium', 'cold'
    reasoning TEXT[], -- Lista de motivos legíveis para humanos
    commercial_tags TEXT[], -- ['no_website', 'weak_presence', etc]
    last_detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(lead_id)
);

-- RLS
ALTER TABLE public.commercial_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for auth users on commercial opportunities" ON public.commercial_opportunities FOR SELECT TO authenticated USING (true);

-- Índices para prospecção rápida
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON public.commercial_opportunities(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_level ON public.commercial_opportunities(opportunity_level);
