'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2 } from 'lucide-react'

interface FollowingListProps {
  userId: string
  className?: string
}

type FollowingUser = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  is_verified: boolean
}

export function FollowingList({ userId, className = '' }: FollowingListProps) {
  const [following, setFollowing] = useState<FollowingUser[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchFollowing() {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select(`
            following_id,
            profiles:following_id (
              id,
              username,
              display_name,
              avatar_url,
              is_verified
            )
          `)
          .eq('follower_id', userId)
          .order('created_at', { ascending: false })
          .limit(12) // Show top 12 followed users

        if (error) throw error

        if (data) {
          // Flatten the structure and type check
          const users = data
            .map(item => item.profiles)
            .filter((profile): profile is FollowingUser => profile !== null)
          setFollowing(users)
        }
      } catch (error) {
        console.error('Error fetching following:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFollowing()
  }, [userId, supabase])

  if (loading) {
    return (
      <div className={`flex justify-center py-4 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (following.length === 0) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      <h3 className="text-sm font-bold text-gray-500 mb-3 px-1">
        Following ({following.length})
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {following.map((user) => (
          <a
            key={user.id}
            href={`/${user.username}`}
            className="group flex flex-col items-center gap-1"
            title={user.display_name || user.username}
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-blue-400 transition-all shadow-sm">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                  No Img
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-600 truncate w-full text-center group-hover:text-blue-600">
              {user.display_name || user.username}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
