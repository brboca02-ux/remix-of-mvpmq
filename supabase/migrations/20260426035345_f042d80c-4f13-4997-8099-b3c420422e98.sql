ALTER TABLE public.lead_import_jobs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Habilitar RLS se não estiver
ALTER TABLE public.lead_import_jobs ENABLE ROW LEVEL SECURITY;

-- Criar política se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'lead_import_jobs' AND policyname = 'Users can manage their own jobs'
    ) THEN
        CREATE POLICY "Users can manage their own jobs" 
        ON public.lead_import_jobs 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;
