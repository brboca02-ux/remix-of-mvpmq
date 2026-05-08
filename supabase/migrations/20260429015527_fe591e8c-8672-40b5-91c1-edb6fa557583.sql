-- Consent records for PF queries
CREATE TABLE IF NOT EXISTS public.consentimentos_pf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf_hash TEXT NOT NULL,
  titular_nome TEXT NOT NULL,
  titular_email TEXT,
  finalidade TEXT NOT NULL,
  base_legal TEXT NOT NULL CHECK (base_legal IN ('consentimento', 'contrato', 'obrigacao_legal', 'legitimo_interesse')),
  documento_url TEXT,
  ip_origem INET,
  user_agent TEXT,
  assinado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  revogado_em TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consentimentos_pf_cpf_hash ON public.consentimentos_pf(cpf_hash);
CREATE INDEX IF NOT EXISTS idx_consentimentos_pf_created_by ON public.consentimentos_pf(created_by);
CREATE INDEX IF NOT EXISTS idx_consentimentos_pf_expira ON public.consentimentos_pf(expira_em) WHERE revogado_em IS NULL;

ALTER TABLE public.consentimentos_pf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own consents"
  ON public.consentimentos_pf FOR SELECT
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'));

CREATE POLICY "Users create own consents"
  ON public.consentimentos_pf FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users revoke own consents"
  ON public.consentimentos_pf FOR UPDATE
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Immutable audit trail
CREATE TABLE IF NOT EXISTS public.consultas_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pf_antecedentes', 'pf_dados', 'pj_cnpj', 'whois', 'social', 'site_publico')),
  alvo_hash TEXT NOT NULL,
  alvo_mascarado TEXT NOT NULL,
  consentimento_id UUID REFERENCES public.consentimentos_pf(id),
  provedor TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sucesso', 'erro', 'bloqueado_lgpd', 'cache_hit')),
  custo_centavos INT NOT NULL DEFAULT 0,
  request_payload JSONB,
  response_summary JSONB,
  ip_origem INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultas_audit_user ON public.consultas_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultas_audit_alvo ON public.consultas_audit(alvo_hash);
CREATE INDEX IF NOT EXISTS idx_consultas_audit_tipo ON public.consultas_audit(tipo, created_at DESC);

ALTER TABLE public.consultas_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own audit logs"
  ON public.consultas_audit FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'));

CREATE POLICY "Users create own audit logs"
  ON public.consultas_audit FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public CNPJ cache
CREATE TABLE IF NOT EXISTS public.consultas_pj_cache (
  cnpj TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  fonte TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_pj_cache_expires ON public.consultas_pj_cache(expires_at);

ALTER TABLE public.consultas_pj_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read PJ cache"
  ON public.consultas_pj_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated upsert PJ cache"
  ON public.consultas_pj_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated update PJ cache"
  ON public.consultas_pj_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Helper: mask CPF
CREATE OR REPLACE FUNCTION public.mask_cpf(p_cpf TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_cpf IS NULL OR length(regexp_replace(p_cpf, '\D', '', 'g')) <> 11 THEN '***'
    ELSE '***.***.***-' || right(regexp_replace(p_cpf, '\D', '', 'g'), 2)
  END;
$$;

-- Helper: validate CPF check digits
CREATE OR REPLACE FUNCTION public.valida_cpf(p_cpf TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_cpf TEXT;
  v_sum INT;
  v_d1 INT;
  v_d2 INT;
  i INT;
BEGIN
  v_cpf := regexp_replace(COALESCE(p_cpf, ''), '\D', '', 'g');
  IF length(v_cpf) <> 11 THEN RETURN FALSE; END IF;
  IF v_cpf ~ '^(\d)\1{10}$' THEN RETURN FALSE; END IF;

  v_sum := 0;
  FOR i IN 1..9 LOOP
    v_sum := v_sum + substring(v_cpf, i, 1)::INT * (11 - i);
  END LOOP;
  v_d1 := (v_sum * 10) % 11;
  IF v_d1 = 10 THEN v_d1 := 0; END IF;
  IF v_d1 <> substring(v_cpf, 10, 1)::INT THEN RETURN FALSE; END IF;

  v_sum := 0;
  FOR i IN 1..10 LOOP
    v_sum := v_sum + substring(v_cpf, i, 1)::INT * (12 - i);
  END LOOP;
  v_d2 := (v_sum * 10) % 11;
  IF v_d2 = 10 THEN v_d2 := 0; END IF;
  RETURN v_d2 = substring(v_cpf, 11, 1)::INT;
END;
$$;