'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { fetchYouTubeChannel } from '@/lib/youtube'

interface Profile {
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
}

export default function ProfileEditPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [linkingGoogle, setLinkingGoogle] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadProfile()

    // Handle OAuth callback from hash fragment
    const handleOAuthCallback = async () => {
      if (window.location.hash && window.location.hash.includes('access_token')) {
        setLinkingGoogle(true)
        setErrorMessage('')
        try {
          const params = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const providerToken = params.get('provider_token')

          if (accessToken && providerToken) {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
              const youtubeData = await fetchYouTubeChannel(providerToken)
              await supabase.from('profiles').update({
                is_verified: true,
                youtube_channel_id: youtubeData.channelId,
                youtube_handle: youtubeData.handle,
                youtube_channel_url: `https://www.youtube.com/channel/${youtubeData.channelId}`,
                auth_provider: 'google',
                updated_at: new Date().toISOString(),
              }).eq('id', user.id)

              setMessage('Googleアカウントと連携しました！')
              window.history.replaceState({}, document.title, window.location.pathname)
              await loadProfile()
            }
          }
        } catch (error) {
          console.error('OAuth linking error:', error)
          setErrorMessage('Google連携中にエラーが発生しました')
        } finally {
          setLinkingGoogle(false)
        }
      }
    }

    handleOAuthCallback()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
      setDisplayName(data.display_name || '')
      setBio(data.bio || '')
      setAvatarUrl(data.avatar_url || '')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    setMessage('')
    setErrorMessage('')

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile?.id || (await supabase.auth.getUser()).data.user?.id,
        username: profile?.username || (await supabase.auth.getUser()).data.user?.user_metadata.username,
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })

    setLoading(false)

    if (error) {
      setErrorMessage('エラーが発生しました: ' + error.message)
    } else {
      setMessage('プロフィールを保存しました！')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleGoogleLink = async () => {
    setLinkingGoogle(true)
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin/profile`,
        scopes: 'email profile https://www.googleapis.com/auth/youtube.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    })

    if (error) {
      setErrorMessage('Google連携に失敗しました: ' + error.message)
      setLinkingGoogle(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          ダッシュボードに戻る
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            プロフィール編集
          </h1>

          {message && (
            <div className="mb-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-2 rounded">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-2 rounded">
              {errorMessage}
            </div>
          )}

          {/* Google連携セクション */}
          <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Google連携
            </h2>

            {profile?.is_verified ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Googleアカウントと連携済み
                </div>

                {profile.youtube_channel_url && (
                  <a
                    href={profile.youtube_channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1"
                  >
                    チャンネル: {profile.youtube_handle || profile.youtube_channel_id}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-500">
                  認証方法: {profile.auth_provider === 'google' ? 'Google' : 'メール'}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Googleアカウントと連携してYouTubeチャンネル情報を取得できます
                </p>
                <button
                  type="button"
                  onClick={handleGoogleLink}
                  disabled={linkingGoogle}
                  className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {linkingGoogle ? '連携中...' : 'Googleと連携する'}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ユーザーID（変更不可）
              </label>
              <input
                id="username"
                type="text"
                value={profile?.username || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                表示名
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                アイコン画像URL
              </label>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover mt-2"
                />
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                自己紹介
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '保存'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
