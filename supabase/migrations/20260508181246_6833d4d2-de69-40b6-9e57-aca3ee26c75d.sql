-- Check if jobs table exists, create if not
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed', 'queued_external')),
    payload JSONB,
    result JSONB,
    idempotency_key TEXT UNIQUE NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 1,
    owner_user_id UUID,
    error TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure job_events has correct structure (since it exists, we alter if needed or just add RLS/Realtime)
-- We know it has id, job_id, event_type, level, message, metadata, created_at from schema info
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Re-create policies for jobs
DROP POLICY IF EXISTS "Enable all for authenticated users on jobs" ON public.jobs;
CREATE POLICY "Enable all for authenticated users on jobs" ON public.jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Re-create policies for job_events
DROP POLICY IF EXISTS "Enable all for authenticated users on job_events" ON public.job_events;
CREATE POLICY "Enable all for authenticated users on job_events" ON public.job_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure job_id in job_events references public.jobs correctly
-- (This might fail if the constraint already exists with a different name)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_events_job_id_fkey') THEN
        ALTER TABLE public.job_events ADD CONSTRAINT job_events_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable Realtime
-- Use DO block to avoid errors if already in publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'jobs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'job_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.job_events;
    END IF;
END $$;

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled ON public.jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_owner_created ON public.jobs(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_events_job_id_created ON public.job_events(job_id, created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_jobs_updated_at ON public.jobs;
CREATE TRIGGER set_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
