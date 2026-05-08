-- Tabela de Análise de Presença Digital
CREATE TABLE IF NOT EXISTS public.digital_presence_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    presence_score FLOAT DEFAULT 0.0,
    confidence_score FLOAT DEFAULT 0.0,
    confidence_level TEXT DEFAULT 'unverified', -- 'high', 'medium', 'low', 'unverified'
    validations JSONB DEFAULT '{}'::jsonb, -- {dns_ok: true, http_ok: true, osm_match: true}
    web_status TEXT, -- 'online', 'offline', 'no_site'
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Registro de Conflitos entre Fontes
CREATE TABLE IF NOT EXISTS public.validation_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    source_a TEXT NOT NULL,
    value_a TEXT,
    source_b TEXT NOT NULL,
    value_b TEXT,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.digital_presence_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for authenticated users on digital analysis" 
ON public.digital_presence_analysis FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow select for authenticated users on conflicts" 
ON public.validation_conflicts FOR SELECT 
TO authenticated 
USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_digital_analysis_lead ON public.digital_presence_analysis(lead_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_lead ON public.validation_conflicts(lead_id);
