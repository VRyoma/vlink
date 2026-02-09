-- Add YouTube-related columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS youtube_handle TEXT,
  ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT,
  ADD COLUMN IF NOT EXISTS youtube_channel_url TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Add index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);

-- Add updated_at column if it doesn't exist
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_verified IS 'True if user verified via Google/YouTube OAuth';
COMMENT ON COLUMN profiles.youtube_handle IS 'YouTube channel handle (@username)';
COMMENT ON COLUMN profiles.youtube_channel_id IS 'YouTube channel ID (UC...)';
COMMENT ON COLUMN profiles.youtube_channel_url IS 'Full YouTube channel URL';
COMMENT ON COLUMN profiles.auth_provider IS 'Authentication method used (email, google, etc.)';
