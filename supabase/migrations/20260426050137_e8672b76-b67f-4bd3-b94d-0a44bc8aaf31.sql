-- Função para recuperar jobs travados (não atualizam heartbeat há mais de 15 min)
CREATE OR REPLACE FUNCTION public.recover_stuck_import_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.lead_import_jobs
    SET status = 'partial',
        finished_at = now()
    WHERE status = 'processing'
      AND (last_heartbeat < now() - interval '15 minutes' OR (last_heartbeat IS NULL AND created_at < now() - interval '15 minutes'));
END;
$$;