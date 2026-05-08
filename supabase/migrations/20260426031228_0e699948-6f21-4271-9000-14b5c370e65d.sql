-- Evoluir Oportunidades Comerciais com Diagnóstico
ALTER TABLE public.commercial_opportunities 
ADD COLUMN IF NOT EXISTS diagnostic_message TEXT,
ADD COLUMN IF NOT EXISTS critical_failure_type TEXT, -- 'website_down', 'no_site', 'no_geo'
ADD COLUMN IF NOT EXISTS technical_meta JSONB DEFAULT '{}'::jsonb;

-- Trigger para registrar falha crítica em job_events para análise de padrões
CREATE OR REPLACE FUNCTION public.log_critical_digital_failure()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.opportunity_level = 'hot' THEN
        INSERT INTO public.job_events (event_type, message, metadata)
        VALUES ('business_opportunity', 'Lead Quente detectado: ' || NEW.critical_failure_type, jsonb_build_object('lead_id', NEW.lead_id, 'score', NEW.opportunity_score));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_failure ON public.commercial_opportunities;
CREATE TRIGGER trigger_log_failure
AFTER INSERT OR UPDATE ON public.commercial_opportunities
FOR EACH ROW EXECUTE FUNCTION public.log_critical_digital_failure();
