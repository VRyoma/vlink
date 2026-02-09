export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  is_verified: boolean
  youtube_handle: string | null
  youtube_channel_id: string | null
  youtube_channel_url: string | null
  auth_provider: string
  created_at: string
  updated_at: string
}

export interface Link {
  id: string
  user_id: string
  title: string
  url: string
  icon_key: string | null
  sort_order: number
  is_visible: boolean
}
