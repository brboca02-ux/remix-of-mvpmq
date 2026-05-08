-- Atualizar constraint de status para incluir 'cancelled'
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('queued', 'running', 'done', 'failed', 'queued_external', 'cancelled'));

-- Adicionar colunas de cancelamento se não existirem
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS cancel_requested BOOLEAN DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

COMMENT ON COLUMN public.jobs.cancel_requested IS 'Indica se o usuário solicitou o cancelamento do job.';
COMMENT ON COLUMN public.jobs.cancelled_at IS 'Data e hora em que o job foi efetivamente cancelado.';
