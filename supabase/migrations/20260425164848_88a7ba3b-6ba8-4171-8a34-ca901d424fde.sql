-- Create lead_import_jobs table
CREATE TABLE IF NOT EXISTS public.lead_import_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Optional for now
    filename TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, partial
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    duplicate_rows INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE
);

-- Create lead_import_errors table
CREATE TABLE IF NOT EXISTS public.lead_import_errors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.lead_import_jobs(id) ON DELETE CASCADE,
    row_number INTEGER,
    raw_payload JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_import_errors ENABLE ROW LEVEL SECURITY;

-- Policies (Public for now as the system doesn't have strict auth yet)
CREATE POLICY "Enable all for lead_import_jobs" ON public.lead_import_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for lead_import_errors" ON public.lead_import_errors FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_import_jobs_updated_at
    BEFORE UPDATE ON public.lead_import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
