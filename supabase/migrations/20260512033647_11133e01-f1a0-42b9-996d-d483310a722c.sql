
-- Tighten RLS on analytics/cache tables that lack tenant scoping. App is single-tenant; restrict to admins.

-- commercial_opportunities
DROP POLICY IF EXISTS "Allow select for auth users on commercial opportunities" ON public.commercial_opportunities;
CREATE POLICY "Admins read commercial_opportunities" ON public.commercial_opportunities
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- digital_presence_analysis
DROP POLICY IF EXISTS "Allow select for authenticated users on digital analysis" ON public.digital_presence_analysis;
CREATE POLICY "Admins read digital_presence_analysis" ON public.digital_presence_analysis
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- field_validation
DROP POLICY IF EXISTS "Allow select for auth users on validations" ON public.field_validation;
CREATE POLICY "Admins read field_validation" ON public.field_validation
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- data_conflicts: remove permissive ALL/SELECT(true), keep admin-only
DROP POLICY IF EXISTS "Admin pode gerenciar conflitos" ON public.data_conflicts;
DROP POLICY IF EXISTS "Allow select for auth users on conflicts" ON public.data_conflicts;
DROP POLICY IF EXISTS "Leitura autenticada data_conflicts" ON public.data_conflicts;
CREATE POLICY "Admins manage data_conflicts" ON public.data_conflicts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- channel_performance
DROP POLICY IF EXISTS "Allow select for auth users on channel_performance" ON public.channel_performance;
CREATE POLICY "Admins read channel_performance" ON public.channel_performance
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- sales_pitch_history
ALTER TABLE public.sales_pitch_history ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='sales_pitch_history' LOOP
    EXECUTE format('DROP POLICY %I ON public.sales_pitch_history', p.policyname);
  END LOOP;
END$$;
CREATE POLICY "Admins manage sales_pitch_history" ON public.sales_pitch_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- sales_followup_sequences
ALTER TABLE public.sales_followup_sequences ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='sales_followup_sequences' LOOP
    EXECUTE format('DROP POLICY %I ON public.sales_followup_sequences', p.policyname);
  END LOOP;
END$$;
CREATE POLICY "Admins manage sales_followup_sequences" ON public.sales_followup_sequences
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- validation_conflicts
ALTER TABLE public.validation_conflicts ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='validation_conflicts' LOOP
    EXECUTE format('DROP POLICY %I ON public.validation_conflicts', p.policyname);
  END LOOP;
END$$;
CREATE POLICY "Admins manage validation_conflicts" ON public.validation_conflicts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- public_api_cache: contains api_key. Restrict to no authenticated access (service role only).
ALTER TABLE public.public_api_cache ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='public_api_cache' LOOP
    EXECUTE format('DROP POLICY %I ON public.public_api_cache', p.policyname);
  END LOOP;
END$$;
-- No policies: only service_role (which bypasses RLS) can access.

-- Add SET search_path to functions missing it (mutable search_path warning)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.calculate_job_confidence() SET search_path = public;
ALTER FUNCTION public.trg_update_lead_confidence() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.log_critical_digital_failure() SET search_path = public;
ALTER FUNCTION public.log_system_health_event() SET search_path = public;
ALTER FUNCTION public.update_channel_performance() SET search_path = public;
ALTER FUNCTION public.update_job_metrics() SET search_path = public;
ALTER FUNCTION public.generate_lead_identity_hash(text,text,text,text) SET search_path = public;
ALTER FUNCTION public.calculate_lead_confidence(uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_expired_location_cache() SET search_path = public;
ALTER FUNCTION public.calculate_conversion_probability(uuid) SET search_path = public;

-- Revoke EXECUTE from anon/authenticated on admin-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.cleanup_old_job_events() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recover_stuck_import_jobs() FROM anon, authenticated;
