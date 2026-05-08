-- Validação por Campo
CREATE TABLE IF NOT EXISTS public.field_validation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    is_valid BOOLEAN DEFAULT false,
    sources_checked TEXT[] DEFAULT '{}',
    conflict_detected BOOLEAN DEFAULT false,
    last_validated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(lead_id, field_name)
);

-- Auditoria de Divergências
CREATE TABLE IF NOT EXISTS public.data_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads_import(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    source_a TEXT NOT NULL,
    value_a TEXT,
    source_b TEXT NOT NULL,
    value_b TEXT,
    conflict_type TEXT DEFAULT 'discrepancy', -- 'format', 'identity', 'location'
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.field_validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for auth users on validations" ON public.field_validation FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for auth users on conflicts" ON public.data_conflicts FOR SELECT TO authenticated USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_field_val_lead ON public.field_validation(lead_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_unresolved ON public.data_conflicts(lead_id) WHERE resolved = false;
