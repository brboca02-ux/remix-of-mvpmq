-- Políticas de Segurança Temporárias para Modo Single-User / Desenvolvimento
-- NOTA: Estas políticas permitem acesso anônimo para facilitar o uso do sistema como ferramenta pessoal/local.
-- Em uma futura migração para multi-tenant (SaaS), estas devem ser substituídas por restrições baseadas em auth.uid().

-- Limpeza de políticas anteriores
DROP POLICY IF EXISTS "Enable all for everyone on jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable all for everyone on job_events" ON public.job_events;
DROP POLICY IF EXISTS "Enable all for authenticated users on jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable all for authenticated users on job_events" ON public.job_events;

-- Novas políticas com nomenclatura explícita de desenvolvimento
CREATE POLICY "DEV_ONLY_ALLOW_ANON_ACCESS_JOBS" ON public.jobs
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "DEV_ONLY_ALLOW_ANON_ACCESS_JOB_EVENTS" ON public.job_events
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE public.jobs IS 'Tabela de jobs em modo DEV. Acesso anon permitido para uso single-user.';
COMMENT ON TABLE public.job_events IS 'Eventos de jobs em modo DEV. Acesso anon permitido para uso single-user.';
