import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Profile, Link as LinkType } from '@/types/supabase'
import { Link, ExternalLink, Github, Twitter, Youtube, Instagram, Globe, Mail } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { VerifiedBadge } from '@/components/VerifiedBadge'
import MfmRenderer from '@/components/MfmRenderer'

const IconRenderer = ({ iconKey }: { iconKey: string | null }) => {
  if (!iconKey) return <Link className="w-4 h-4 text-gray-500 dark:text-gray-400" />
  
  const key = iconKey.toLowerCase()
  if (key.includes('github')) return <Github className="w-4 h-4 text-gray-500 dark:text-gray-400" />
  if (key.includes('twitter') || key.includes('x')) return <Twitter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
  if (key.includes('youtube')) return <Youtube className="w-4 h-4 text-red-500" />
  if (key.includes('instagram')) return <Instagram className="w-4 h-4 text-pink-500" />
  if (key.includes('mail')) return <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
  
  return <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
}

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

  const themeColor = profile.theme_color || '#ffffff'
  const backgroundUrl = profile.background_url

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ 
        backgroundColor: themeColor,
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better readability if background image is present */}
      <div className={`min-h-screen w-full py-12 px-6 ${backgroundUrl ? 'bg-black/20 backdrop-blur-[2px]' : ''}`}>
        <div className="max-w-md mx-auto">
          {/* Profile Section */}
          <div className="flex flex-col items-center gap-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || profile.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                <IconRenderer iconKey={null} />
              </div>
            )}

            <div className="text-center">
              {/* Name with Verified Badge */}
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">
                  {profile.display_name || profile.username}
                </h1>
                {profile.is_verified && <VerifiedBadge size="lg" />}
              </div>

              <p className="text-gray-600 font-medium mt-1">
                @{profile.username}
              </p>

              {/* YouTube Link */}
              {profile.youtube_channel_url && (
                <a
                  href={profile.youtube_channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-red-600 hover:text-red-700 font-bold bg-white/80 px-3 py-1 rounded-full text-sm shadow-sm"
                >
                  <Youtube className="w-4 h-4" />
                  YouTube チャンネル
                </a>
              )}

              {/* Bio */}
              {profile.bio && (
                <div className="text-gray-800 mt-4 px-4 py-2 bg-white/40 backdrop-blur-md rounded-xl shadow-sm border border-white/20">
                  <MfmRenderer text={profile.bio} />
                </div>
              )}
            </div>
          </div>

          {/* Links Section */}
          {links && links.length > 0 && (
            <div className="mt-8 space-y-4">
              {links.map((link: LinkType) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block w-full bg-white/90 hover:bg-white backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-white/50 transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconRenderer iconKey={link.icon_key} />
                      <span className="font-bold text-gray-800">
                        {link.title}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
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
