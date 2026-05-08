-- Function to cleanup old job events for DEV mode
-- Deletes 'info' level events older than 30 days
-- Preserves 'warn' and 'error' levels for troubleshooting
-- Preserves events of jobs that are still not finished

CREATE OR REPLACE FUNCTION public.cleanup_old_job_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.job_events
  WHERE level = 'info'
    AND created_at < now() - interval '30 days'
    AND job_id NOT IN (
      SELECT id FROM public.jobs 
      WHERE status IN ('queued', 'running', 'queued_external')
    );
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_job_events() IS 'Limpeza auxiliar para modo DEV. Cron automático será tratado em onda futura.';
