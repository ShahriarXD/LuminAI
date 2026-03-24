ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS message_metadata JSONB;
