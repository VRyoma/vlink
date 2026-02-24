'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Handshake } from 'lucide-react'

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
  is_mutual?: boolean
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
        // 1. Fetch users that the current profile (userId) follows
        const { data: followingData, error: followingError } = await supabase
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
          .limit(12)

        if (followingError) throw followingError

        if (!followingData || followingData.length === 0) {
          setFollowing([])
          return
        }

        // 2. Extract profile data
        const users = followingData
          .map(item => item.profiles)
          .filter((profile): profile is FollowingUser => 
            profile !== null && typeof profile === 'object' && 'id' in profile
          )

        // 3. Check for mutual follows (Does the followed user also follow userId?)
        // Fetch list of users who follow userId (followers)
        // Filter by the IDs we just retrieved to optimize
        const followingIds = users.map(u => u.id)
        
        const { data: mutualData, error: mutualError } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId)
          .in('follower_id', followingIds)

        if (!mutualError && mutualData) {
          const mutualSet = new Set(mutualData.map(m => m.follower_id))
          // Mark mutuals
          users.forEach(u => {
            u.is_mutual = mutualSet.has(u.id)
          })
        }

        setFollowing(users)
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
      <h3 className="text-sm font-bold text-gray-500 mb-3 px-1 flex items-center gap-2">
        <span>Following</span>
        <span className="text-xs font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          {following.length}
        </span>
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {following.map((user) => (
          <a
            key={user.id}
            href={`/${user.username}`}
            className="group flex flex-col items-center gap-1 relative"
            title={user.display_name || user.username}
          >
            <div className={`
              relative w-12 h-12 rounded-full overflow-hidden 
              border-2 transition-all shadow-sm
              ${user.is_mutual 
                ? 'border-pink-400 ring-2 ring-pink-100' 
                : 'border-transparent group-hover:border-blue-400'
              }
            `}>
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
              
              {/* Mutual Badge (Handshake icon) */}
              {user.is_mutual && (
                <div className="absolute bottom-0 right-0 bg-pink-500 text-white p-[2px] rounded-tl-md" title="相互リンク (Mutual)">
                  <Handshake className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            
            <span className={`
              text-[10px] truncate w-full text-center 
              ${user.is_mutual ? 'text-pink-600 font-medium' : 'text-gray-600 group-hover:text-blue-600'}
            `}>
              {user.display_name || user.username}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
