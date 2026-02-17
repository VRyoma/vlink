'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, GripVertical, Edit, Eye, EyeOff, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { fetchYouTubeChannel } from '@/lib/youtube'

interface LinkItem {
  id: string
  user_id: string
  title: string
  url: string
  icon_key: string | null
  sort_order: number
  is_visible: boolean
}

interface Profile {
  id: string
  username: string
  is_verified: boolean
  youtube_handle: string | null
  youtube_channel_id: string | null
  youtube_channel_url: string | null
  auth_provider: string
}

interface EditingLink extends Partial<LinkItem> {
  isNew?: boolean
}

export default function LinksManagePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [linkingGoogle, setLinkingGoogle] = useState(false)
  const [editingLink, setEditingLink] = useState<EditingLink | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()

    // Handle OAuth callback
    const handleOAuthCallback = async () => {
      if (window.location.hash && window.location.hash.includes('access_token')) {
        setLinkingGoogle(true)
        try {
          const params = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = params.get('access_token')
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

              setMessage('YouTubeチャンネルと連携しました！')
              window.history.replaceState({}, document.title, window.location.pathname)
              await loadData()
            }
          }
        } catch (error) {
          console.error('OAuth linking error:', error)
          alert('連携中にエラーが発生しました')
        } finally {
          setLinkingGoogle(false)
        }
      }
    }

    handleOAuthCallback()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, is_verified, youtube_handle, youtube_channel_id, youtube_channel_url, auth_provider')
      .eq('id', user.id)
      .single()
    
    if (profileData) setProfile(profileData)

    // Load links
    const { data } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (data) {
      setLinks(data)
    }
    setLoading(false)
  }

  const handleGoogleLink = async () => {
    setLinkingGoogle(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin/links`,
        scopes: 'email profile https://www.googleapis.com/auth/youtube.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    })

    if (error) {
      alert('Google連携に失敗しました: ' + error.message)
      setLinkingGoogle(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLink) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingLink.isNew) {
      const { error } = await supabase.from('links').insert({
        user_id: user.id,
        title: editingLink.title!,
        url: editingLink.url!,
        icon_key: editingLink.icon_key || null,
        sort_order: links.length,
        is_visible: editingLink.is_visible ?? true,
      })
      if (error) {
        alert('エラーが発生しました: ' + error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('links')
        .update({
          title: editingLink.title,
          url: editingLink.url,
          icon_key: editingLink.icon_key,
          is_visible: editingLink.is_visible,
        })
        .eq('id', editingLink.id!)
      if (error) {
        alert('エラーが発生しました: ' + error.message)
        return
      }
    }

    setEditingLink(null)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return

    const { error } = await supabase.from('links').delete().eq('id', id)
    if (error) {
      alert('エラーが発生しました: ' + error.message)
      return
    }
    loadData()
  }

  const handleToggleVisibility = async (link: LinkItem) => {
    const { error } = await supabase
      .from('links')
      .update({ is_visible: !link.is_visible })
      .eq('id', link.id)
    if (error) {
      alert('エラーが発生しました: ' + error.message)
      return
    }
    loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-white">読み込み中...</div>
      </div>
    )
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

        {message && (
          <div className="mb-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-2 rounded">
            {message}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 space-y-8">
          {/* YouTube Integration Section */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              YouTube 連携 & 本人認証
            </h2>

            {profile?.is_verified ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  YouTubeチャンネルと連携済み
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
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  YouTubeチャンネルと連携すると、公式認証バッジが付与され、チャンネルへのリンクが自動的に追加されます。
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
                  {linkingGoogle ? '連携中...' : 'YouTubeと連携する'}
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                リンク一覧
              </h1>
              <button
                onClick={() => setEditingLink({ isNew: true })}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                新規追加
              </button>
            </div>

            {editingLink && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {editingLink.isNew ? '新しいリンク' : 'リンク編集'}
                </h2>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      タイトル
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={editingLink.title || ''}
                      onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL
                    </label>
                    <input
                      id="url"
                      type="url"
                      value={editingLink.url || ''}
                      onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="icon_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      アイコンキー（任意: Github, Twitter, Youtube等）
                    </label>
                    <input
                      id="icon_key"
                      type="text"
                      value={editingLink.icon_key || ''}
                      onChange={(e) => setEditingLink({ ...editingLink, icon_key: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="is_visible"
                      type="checkbox"
                      checked={editingLink.is_visible ?? true}
                      onChange={(e) => setEditingLink({ ...editingLink, is_visible: e.target.checked })}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_visible" className="text-sm text-gray-700 dark:text-gray-300">
                      公開する
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLink(null)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {link.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                        {link.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(link)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      title={link.is_visible ? '非表示にする' : '表示する'}
                    >
                      {link.is_visible ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingLink(link)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                      title="編集"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {links.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  リンクがありません。「新規追加」ボタンからリンクを追加してください。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
