-- Add pin, tags, and sharing support to chats
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS share_id text UNIQUE DEFAULT NULL;

-- Allow anonymous users to read public shared chats
CREATE POLICY "Anyone can view public chats" ON public.chats FOR SELECT USING (is_public = true);
CREATE POLICY "Anyone can view messages of public chats" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.is_public = true));