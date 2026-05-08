-- 1. integration_settings: configuração do webhook por usuário
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'make',
  webhook_url TEXT,
  secret_token TEXT,
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_interval_sec INTEGER NOT NULL DEFAULT 30,
  default_tone TEXT NOT NULL DEFAULT 'profissional',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integration settings"
  ON public.integration_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integration settings"
  ON public.integration_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration settings"
  ON public.integration_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete integration settings"
  ON public.integration_settings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_integration_settings_updated_at
  BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. make_send_log: histórico append-only
CREATE TABLE public.make_send_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID,
  request_id UUID NOT NULL UNIQUE,
  channels TEXT[] NOT NULL DEFAULT '{}',
  variant TEXT,
  message_preview TEXT,
  status TEXT NOT NULL DEFAULT 'sending',
  http_status INTEGER,
  response_time_ms INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ
);

ALTER TABLE public.make_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own send logs"
  ON public.make_send_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own send logs"
  ON public.make_send_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_make_send_log_user_sent
  ON public.make_send_log(user_id, sent_at DESC);

CREATE INDEX idx_make_send_log_lead
  ON public.make_send_log(lead_id) WHERE lead_id IS NOT NULL;

-- 3. make_send_queue: retentativas pendentes
CREATE TABLE public.make_send_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.make_send_log(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  payload JSONB NOT NULL,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.make_send_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own queue"
  ON public.make_send_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own queue"
  ON public.make_send_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue"
  ON public.make_send_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own queue"
  ON public.make_send_queue FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_make_send_queue_pending
  ON public.make_send_queue(next_attempt_at)
  WHERE status = 'pending';

CREATE TRIGGER update_make_send_queue_updated_at
  BEFORE UPDATE ON public.make_send_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();