-- Create oshi_links table for curated external links (favorites/recommendations)
CREATE TABLE IF NOT EXISTS public.oshi_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT, -- Can be auto-fetched or user-overridden
  description TEXT, -- Can be auto-fetched
  image_url TEXT, -- Can be auto-fetched (OGP image)
  site_name TEXT, -- e.g., "YouTube", "Amazon"
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.oshi_links ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view oshi links
CREATE POLICY "Oshi links are viewable by everyone" 
ON public.oshi_links FOR SELECT USING (true);

-- Users can manage their own oshi links
CREATE POLICY "Users can manage their own oshi links" 
ON public.oshi_links FOR ALL USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.oshi_links;

-- Indexing
CREATE INDEX IF NOT EXISTS idx_oshi_links_user_id ON public.oshi_links(user_id);
