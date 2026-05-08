-- Add columns for manual contact control and follow-up sequence
ALTER TABLE public.leads_import 
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS followup_status TEXT DEFAULT 'never_contacted',
ADD COLUMN IF NOT EXISTS followup_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS interest_level TEXT DEFAULT 'interested',
ADD COLUMN IF NOT EXISTS contact_notes TEXT,
ADD COLUMN IF NOT EXISTS follow_up_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_discarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discard_reason TEXT,
ADD COLUMN IF NOT EXISTS lead_operation_status TEXT DEFAULT 'Nunca analisado';

-- Create an index for follow-up scheduling
CREATE INDEX IF NOT EXISTS idx_leads_import_followup ON public.leads_import (next_followup_at, followup_status);
CREATE INDEX IF NOT EXISTS idx_leads_import_discarded ON public.leads_import (is_discarded);
