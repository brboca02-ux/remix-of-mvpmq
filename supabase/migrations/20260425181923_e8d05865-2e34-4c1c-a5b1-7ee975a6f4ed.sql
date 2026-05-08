-- Tabela de Auditoria de Deduplicação
CREATE TABLE IF NOT EXISTS public.lead_dedupe_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.lead_import_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    lead_identifier TEXT NOT NULL, -- ex: CNPJ ou Telefone
    reason TEXT NOT NULL, -- ex: 'DUPLICATE_CNPJ', 'DUPLICATE_PHONE'
    original_lead_id UUID, -- Referência ao lead que já existia (se possível)
    incoming_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.lead_dedupe_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dedupe audit"
ON public.lead_dedupe_audit FOR SELECT
USING (auth.uid() = user_id);

-- Tabela de Relatórios de Job (Insights e PDF)
CREATE TABLE IF NOT EXISTS public.lead_job_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.lead_import_jobs(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL,
    executive_summary JSONB, -- {quality_score, sources_breakdown, top_cities}
    insights TEXT[], -- Array de recomendações automáticas
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.lead_job_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own job reports"
ON public.lead_job_reports FOR SELECT
USING (auth.uid() = user_id);

-- Evoluir lead_import_jobs
ALTER TABLE public.lead_import_jobs 
ADD COLUMN IF NOT EXISTS sample_rate FLOAT DEFAULT 100.0, -- 1-100%
ADD COLUMN IF NOT EXISTS confidence_score FLOAT, -- 0-100
ADD COLUMN IF NOT EXISTS sources_stat JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS auto_insights TEXT[];

-- Função para atualizar o score de confiança do Job baseado nos erros/sucessos
CREATE OR REPLACE FUNCTION public.calculate_job_confidence()
RETURNS TRIGGER AS $$
DECLARE
    total_val INTEGER;
    success_val INTEGER;
    score FLOAT;
BEGIN
    total_val := NEW.total_rows;
    success_val := NEW.success_rows;
    
    IF total_val > 0 THEN
        score := (success_val::FLOAT / total_val::FLOAT) * 100.0;
        NEW.confidence_score := score;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_confidence
BEFORE UPDATE OF success_rows, total_rows ON public.lead_import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.calculate_job_confidence();