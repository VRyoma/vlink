'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  targetUserId: string
  currentUserId: string | null
  initialIsFollowing: boolean
}

export default function FollowButton({ 
  targetUserId, 
  currentUserId, 
  initialIsFollowing 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleFollow = async () => {
    if (!currentUserId) {
      // If not logged in, redirect to login page
      router.push('/admin/login')
      return
    }

    if (loading) return
    setLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .match({ 
            follower_id: currentUserId, 
            following_id: targetUserId 
          })

        if (error) throw error
        setIsFollowing(false)
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ 
            follower_id: currentUserId, 
            following_id: targetUserId 
          })

        if (error) throw error
        setIsFollowing(true)
      }
      
      router.refresh()
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  // Use different styles based on follow state
  const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm transform hover:-translate-y-0.5 active:translate-y-0"
  
  if (isFollowing) {
    return (
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`${baseClasses} bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
        <span>フォロー中</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`${baseClasses} bg-blue-600 text-white hover:bg-blue-700`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      <span>フォローする</span>
    </button>
  )
}
