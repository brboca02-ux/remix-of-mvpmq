
-- Tighten overly permissive RLS policies. Restrict anonymous public access; owner-scope where possible.

-- leads_import: no user_id column — restrict to authenticated
DROP POLICY IF EXISTS "leads_import public insert" ON public.leads_import;
DROP POLICY IF EXISTS "leads_import public read" ON public.leads_import;
DROP POLICY IF EXISTS "leads_import public update" ON public.leads_import;
CREATE POLICY "leads_import auth read" ON public.leads_import FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_import auth insert" ON public.leads_import FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_import auth update" ON public.leads_import FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- market_research_reports: owner-scoped
DROP POLICY IF EXISTS "Allow public access for dev" ON public.market_research_reports;
CREATE POLICY "Users read own reports" ON public.market_research_reports FOR SELECT TO authenticated USING (auth.uid() = owner_user_id);
CREATE POLICY "Users insert own reports" ON public.market_research_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users update own reports" ON public.market_research_reports FOR UPDATE TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users delete own reports" ON public.market_research_reports FOR DELETE TO authenticated USING (auth.uid() = owner_user_id);

-- jobs: owner-scoped
DROP POLICY IF EXISTS "DEV_ONLY_ALLOW_ANON_ACCESS_JOBS" ON public.jobs;
CREATE POLICY "Users manage own jobs" ON public.jobs FOR ALL TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

-- job_events: scope via parent job ownership
DROP POLICY IF EXISTS "DEV_ONLY_ALLOW_ANON_ACCESS_JOB_EVENTS" ON public.job_events;
CREATE POLICY "Users read own job events" ON public.job_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_events.job_id AND j.owner_user_id = auth.uid()));
CREATE POLICY "Users insert own job events" ON public.job_events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_events.job_id AND j.owner_user_id = auth.uid()));

-- leads_analysis: no user_id — restrict to authenticated
DROP POLICY IF EXISTS "Public leads_analysis are deletable by everyone" ON public.leads_analysis;
DROP POLICY IF EXISTS "Public leads_analysis are insertable by everyone" ON public.leads_analysis;
DROP POLICY IF EXISTS "Public leads_analysis are viewable by everyone" ON public.leads_analysis;
CREATE POLICY "leads_analysis auth select" ON public.leads_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_analysis auth insert" ON public.leads_analysis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_analysis auth delete" ON public.leads_analysis FOR DELETE TO authenticated USING (true);

-- enriquecimento_cache: authenticated only
DROP POLICY IF EXISTS "enriquecimento_cache public insert" ON public.enriquecimento_cache;
DROP POLICY IF EXISTS "enriquecimento_cache public read" ON public.enriquecimento_cache;
DROP POLICY IF EXISTS "enriquecimento_cache public update" ON public.enriquecimento_cache;
CREATE POLICY "enriquecimento_cache auth read" ON public.enriquecimento_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "enriquecimento_cache auth insert" ON public.enriquecimento_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "enriquecimento_cache auth update" ON public.enriquecimento_cache FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- empresas_cache: authenticated only
DROP POLICY IF EXISTS "empresas_cache public read" ON public.empresas_cache;
CREATE POLICY "empresas_cache auth read" ON public.empresas_cache FOR SELECT TO authenticated USING (true);

-- lead_import_errors: scope via parent job ownership
DROP POLICY IF EXISTS "Enable all for lead_import_errors" ON public.lead_import_errors;
CREATE POLICY "Users read own import errors" ON public.lead_import_errors FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.lead_import_jobs j WHERE j.id = lead_import_errors.job_id AND j.user_id = auth.uid()));
CREATE POLICY "Users insert own import errors" ON public.lead_import_errors FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.lead_import_jobs j WHERE j.id = lead_import_errors.job_id AND j.user_id = auth.uid()));

-- lead_import_jobs: remove blanket policy, keep user-scoped
DROP POLICY IF EXISTS "Enable all for lead_import_jobs" ON public.lead_import_jobs;

-- lead_enrichment_queue: authenticated only
DROP POLICY IF EXISTS "Serviço pode gerenciar fila" ON public.lead_enrichment_queue;
CREATE POLICY "lead_enrichment_queue auth all" ON public.lead_enrichment_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- profile_conversion_stats: authenticated read only (aggregate stats)
DROP POLICY IF EXISTS "Enable all for profile stats" ON public.profile_conversion_stats;
CREATE POLICY "profile_conversion_stats auth read" ON public.profile_conversion_stats FOR SELECT TO authenticated USING (true);

-- provider_quota: authenticated read only (quotas should be admin-only writable; remove public update)
DROP POLICY IF EXISTS "provider_quota public read" ON public.provider_quota;
DROP POLICY IF EXISTS "provider_quota public update" ON public.provider_quota;
CREATE POLICY "provider_quota auth read" ON public.provider_quota FOR SELECT TO authenticated USING (true);

-- lead_data_sources: authenticated only
DROP POLICY IF EXISTS "Leitura pública lead_data_sources" ON public.lead_data_sources;
DROP POLICY IF EXISTS "Inserção sistema lead_data_sources" ON public.lead_data_sources;
-- Allow select for authenticated users policy already exists; add insert for authenticated
CREATE POLICY "lead_data_sources auth insert" ON public.lead_data_sources FOR INSERT TO authenticated WITH CHECK (true);

-- cnpj_base_receita: authenticated only (public business registry, but still gate behind auth)
DROP POLICY IF EXISTS "Leitura pública cnpj_base_receita" ON public.cnpj_base_receita;
CREATE POLICY "cnpj_base_receita auth read" ON public.cnpj_base_receita FOR SELECT TO authenticated USING (true);

-- pesquisas_cache: authenticated only
DROP POLICY IF EXISTS "pesquisas_cache public read" ON public.pesquisas_cache;
CREATE POLICY "pesquisas_cache auth read" ON public.pesquisas_cache FOR SELECT TO authenticated USING (true);

-- location_cache: authenticated only
DROP POLICY IF EXISTS "Public location_cache are insertable by everyone" ON public.location_cache;
DROP POLICY IF EXISTS "Public location_cache are viewable by everyone" ON public.location_cache;
CREATE POLICY "location_cache auth read" ON public.location_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "location_cache auth insert" ON public.location_cache FOR INSERT TO authenticated WITH CHECK (true);
