-- 1. Tabelas (Idempotentes)
CREATE TABLE IF NOT EXISTS public.lead_job_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.lead_import_jobs(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL,
    summary JSONB NOT NULL,
    source_distribution JSONB DEFAULT '{}'::jsonb,
    city_distribution JSONB DEFAULT '{}'::jsonb,
    insights TEXT[] DEFAULT '{}',
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. RLS (Garantindo que não falhe se já existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own reports') THEN
        ALTER TABLE public.lead_job_reports ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view their own reports" ON public.lead_job_reports FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. Evolução de Jobs
ALTER TABLE public.lead_import_jobs 
ADD COLUMN IF NOT EXISTS sample_rate FLOAT DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS auto_insights TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_stats JSONB DEFAULT '{}'::jsonb;

-- 4. Métricas Automáticas
CREATE OR REPLACE FUNCTION public.update_job_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_rows > 0 THEN
        NEW.confidence_score := (NEW.success_rows::FLOAT / NEW.total_rows::FLOAT) * 100.0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_job_metrics ON public.lead_import_jobs;
CREATE TRIGGER tr_update_job_metrics
BEFORE UPDATE OF success_rows, failed_rows, total_rows ON public.lead_import_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_job_metrics();