-- Permitir acesso total para usuários anônimos (modo single-user/dev)
DROP POLICY IF EXISTS "Enable all for authenticated users on jobs" ON public.jobs;
CREATE POLICY "Enable all for everyone on jobs" ON public.jobs
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for authenticated users on job_events" ON public.job_events;
CREATE POLICY "Enable all for everyone on job_events" ON public.job_events
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
