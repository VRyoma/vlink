export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
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
