-- Evoluir auditoria de deduplicação
ALTER TABLE public.lead_dedupe_audit 
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS normalized_values JSONB,
ADD COLUMN IF NOT EXISTS similarity_score FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS action_taken TEXT DEFAULT 'skipped', -- 'skipped', 'merged', 'inserted_override'
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Tabela para Health Checks do Sistema
CREATE TABLE IF NOT EXISTS public.system_health_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component TEXT NOT NULL, -- 'jobs', 'enrichment', 'public_api', 'realtime'
    status TEXT NOT NULL, -- 'healthy', 'degraded', 'critical'
    message TEXT,
    metrics JSONB,
    last_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_health_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Health status is viewable by all authenticated users"
ON public.system_health_status FOR SELECT
USING (auth.role() = 'authenticated');

-- Função para registrar eventos de saúde
CREATE OR REPLACE FUNCTION public.log_system_health_event()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != 'healthy' THEN
        INSERT INTO public.job_events (event_type, message, metadata)
        VALUES ('warning', 'Health Check: ' || NEW.component || ' is ' || NEW.status, NEW.metrics);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_health_event
AFTER INSERT OR UPDATE ON public.system_health_status
FOR EACH ROW EXECUTE FUNCTION public.log_system_health_event();
