-- Add niche if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'leads_import' AND COLUMN_NAME = 'niche') THEN
        ALTER TABLE public.leads_import ADD COLUMN niche TEXT;
    END IF;
END $$;
