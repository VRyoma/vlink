import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Profile, Link as LinkType } from '@/types/supabase'
import { Link, ExternalLink } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { VerifiedBadge } from '@/components/VerifiedBadge'

function ProfileFallback() {
  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="animate-pulse space-y-4">
        <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto" />
        <div className="h-8 bg-gray-300 rounded w-48 mx-auto" />
        <div className="h-4 bg-gray-300 rounded w-32 mx-auto" />
      </div>
    </div>
  )
}

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

async function BioPage({ username }: { username: string }) {
  const supabase = await getSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Profile Section */}
        <div className="flex flex-col items-center gap-6">
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          )}

          <div className="text-center">
            {/* Name with Verified Badge */}
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.display_name || profile.username}
              </h1>
              {profile.is_verified && <VerifiedBadge size="lg" />}
            </div>

            <p className="text-gray-600 dark:text-gray-300 mt-2">
              @{profile.username}
            </p>

            {/* YouTube Link */}
            {profile.youtube_channel_url && (
              <a
                href={profile.youtube_channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                YouTube チャンネル
              </a>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-700 dark:text-gray-400 mt-3 px-4">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Links Section */}
        {links && links.length > 0 && (
          <div className="mt-8 space-y-3">
            {links.map((link: LinkType) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {link.title}
                  </span>
                  <Link className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default async function UsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params
  return (
    <Suspense fallback={<ProfileFallback />}>
      <BioPage username={resolvedParams.username} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params
  const supabase = await getSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio')
    .eq('username', resolvedParams.username)
    .single()

  if (!profile) {
    return {
      title: 'プロフィールが見つかりません',
    }
  }

  return {
    title: `${profile.display_name || resolvedParams.username} - リンク集`,
    description: profile.bio || `${profile.display_name || resolvedParams.username}のリンク一覧`,
  }
}
