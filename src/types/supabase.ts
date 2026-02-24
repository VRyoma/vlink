export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      links: {
        Row: {
          created_at: string
          icon_key: string | null
          id: string
          is_visible: boolean | null
          sort_order: number | null
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon_key?: string | null
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon_key?: string | null
          id?: string
          is_visible?: boolean | null
          sort_order?: number | null
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      oshi_links: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          site_name: string | null
          sort_order: number | null
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          site_name?: string | null
          sort_order?: number | null
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          site_name?: string | null
          sort_order?: number | null
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oshi_links_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          background_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_verified: boolean | null
          theme_color: string | null
          updated_at: string
          username: string
          youtube_channel_id: string | null
          youtube_channel_url: string | null
          youtube_handle: string | null
          youtube_subscriber_count: number | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          background_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_verified?: boolean | null
          theme_color?: string | null
          updated_at?: string
          username: string
          youtube_channel_id?: string | null
          youtube_channel_url?: string | null
          youtube_handle?: string | null
          youtube_subscriber_count?: number | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          background_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean | null
          theme_color?: string | null
          updated_at?: string
          username?: string
          youtube_channel_id?: string | null
          youtube_channel_url?: string | null
          youtube_handle?: string | null
          youtube_subscriber_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type Profile = Tables<'profiles'>
export type Link = Tables<'links'>
export type OshiLink = Tables<'oshi_links'>
export type Follow = Tables<'follows'>
