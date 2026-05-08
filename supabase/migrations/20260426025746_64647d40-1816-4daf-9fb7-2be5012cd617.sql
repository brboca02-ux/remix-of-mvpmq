-- Tabela de linhagem de dados
CREATE TABLE IF NOT EXISTS public.lead_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    source_name TEXT NOT NULL,
    confidence_score FLOAT DEFAULT 0.0,
    raw_response JSONB,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar metadados de confiança
ALTER TABLE public.leads_import 
ADD COLUMN IF NOT EXISTS confidence_level TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS verification_flags JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_verification_at TIMESTAMP WITH TIME ZONE;

-- Cache de APIs
CREATE TABLE IF NOT EXISTS public.public_api_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    response_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.lead_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_api_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for authenticated users" 
ON public.lead_data_sources FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow select for authenticated users on cache" 
ON public.public_api_cache FOR SELECT 
TO authenticated 
USING (true);
