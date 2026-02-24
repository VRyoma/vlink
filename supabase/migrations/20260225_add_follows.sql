-- Create follows table for user-to-user relationships
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT distinct_users CHECK (follower_id != following_id)
);

-- Add subscriber count to profiles for future use
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS youtube_subscriber_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view follows (public social graph)
CREATE POLICY "Follows are viewable by everyone" 
ON public.follows FOR SELECT USING (true);

-- Authenticated users can follow others
CREATE POLICY "Users can follow others" 
ON public.follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

-- Authenticated users can unfollow
CREATE POLICY "Users can unfollow" 
ON public.follows FOR DELETE 
USING (auth.uid() = follower_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;

-- Indexing
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
