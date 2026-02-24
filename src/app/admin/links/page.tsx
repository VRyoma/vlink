'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, GripVertical, Edit, Eye, EyeOff, Link as LinkIcon, ExternalLink, Star, Loader2, Image as ImageIcon } from 'lucide-react'
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

interface OshiLinkItem {
  id: string
  user_id: string
  title: string | null
  url: string
  description: string | null
  image_url: string | null
  site_name: string | null
  sort_order: number
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

interface EditingOshiLink extends Partial<OshiLinkItem> {
  isNew?: boolean
}

export default function LinksManagePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'links' | 'oshi'>('links')
  const [profile, setProfile] = useState<Profile | null>(null)
  
  // Standard Links State
  const [links, setLinks] = useState<LinkItem[]>([])
  const [editingLink, setEditingLink] = useState<EditingLink | null>(null)
  
  // Oshi Links State
  const [oshiLinks, setOshiLinks] = useState<OshiLinkItem[]>([])
  const [editingOshiLink, setEditingOshiLink] = useState<EditingOshiLink | null>(null)
  const [ogpLoading, setOgpLoading] = useState(false)

  const [loading, setLoading] = useState(true)
  const [linkingGoogle, setLinkingGoogle] = useState(false)
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
              const youtubeUrl = `https://www.youtube.com/channel/${youtubeData.channelId}`
              
              await supabase.from('profiles').update({
                is_verified: true,
                youtube_channel_id: youtubeData.channelId,
                youtube_handle: youtubeData.handle,
                youtube_channel_url: youtubeUrl,
                auth_provider: 'google',
                updated_at: new Date().toISOString(),
              }).eq('id', user.id)

              // Automatically add YouTube to links if not already present
              const { data: existingLink } = await supabase
                .from('links')
                .select('id')
                .eq('user_id', user.id)
                .ilike('title', '%YouTube%')
                .single()

              if (!existingLink) {
                await supabase.from('links').insert({
                  user_id: user.id,
                  title: 'YouTube',
                  url: youtubeUrl,
                  icon_key: 'Youtube',
                  sort_order: 0,
                  is_visible: true,
                })
              }

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

    // Load standard links
    const { data: linksData } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (linksData) setLinks(linksData)

    // Load Oshi links
    const { data: oshiData } = await supabase
      .from('oshi_links')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (oshiData) setOshiLinks(oshiData)

    setLoading(false)
  }

  // --- OGP Fetch Logic ---
  const handleFetchOgp = async () => {
    if (!editingOshiLink?.url) return
    setOgpLoading(true)

    try {
      const res = await fetch('/api/ogp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: editingOshiLink.url }),
      })

      if (!res.ok) throw new Error('Failed to fetch OGP')
      
      const data = await res.json()
      setEditingOshiLink(prev => ({
        ...prev,
        title: data.title || prev?.title || '',
        description: data.description || prev?.description || '',
        image_url: data.image || prev?.image_url || '',
        site_name: data.site_name || prev?.site_name || '',
      }))
    } catch (error) {
      console.error('OGP Error:', error)
      alert('情報の取得に失敗しました。URLを確認してください。')
    } finally {
      setOgpLoading(false)
    }
  }

  // --- Standard Link Handlers ---
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

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLink) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingLink.isNew) {
      // Profile check logic omitted for brevity as it was in original code
      const { error } = await supabase.from('links').insert({
        user_id: user.id,
        title: editingLink.title!,
        url: editingLink.url!,
        icon_key: editingLink.icon_key || null,
        sort_order: links.length,
        is_visible: editingLink.is_visible ?? true,
      })
      if (error) {
        alert('エラー: ' + error.message)
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
        alert('エラー: ' + error.message)
        return
      }
    }
    setEditingLink(null)
    loadData()
  }

  const handleDeleteLink = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return
    const { error } = await supabase.from('links').delete().eq('id', id)
    if (error) alert('エラー: ' + error.message)
    else loadData()
  }

  const handleToggleVisibility = async (link: LinkItem) => {
    const { error } = await supabase
      .from('links')
      .update({ is_visible: !link.is_visible })
      .eq('id', link.id)
    if (error) alert('エラー: ' + error.message)
    else loadData()
  }

  // --- Oshi Link Handlers ---
  const handleSaveOshiLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOshiLink) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingOshiLink.isNew) {
      const { error } = await supabase.from('oshi_links').insert({
        user_id: user.id,
        url: editingOshiLink.url!,
        title: editingOshiLink.title || null,
        description: editingOshiLink.description || null,
        image_url: editingOshiLink.image_url || null,
        site_name: editingOshiLink.site_name || null,
        sort_order: oshiLinks.length,
      })
      if (error) {
        alert('エラー: ' + error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('oshi_links')
        .update({
          url: editingOshiLink.url,
          title: editingOshiLink.title,
          description: editingOshiLink.description,
          image_url: editingOshiLink.image_url,
          site_name: editingOshiLink.site_name,
        })
        .eq('id', editingOshiLink.id!)
      if (error) {
        alert('エラー: ' + error.message)
        return
      }
    }
    setEditingOshiLink(null)
    loadData()
  }

  const handleDeleteOshiLink = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return
    const { error } = await supabase.from('oshi_links').delete().eq('id', id)
    if (error) alert('エラー: ' + error.message)
    else loadData()
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
      <div className="max-w-4xl mx-auto px-6 py-12">
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
          
          {/* YouTube Integration Section (Always Visible) */}
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
                  <a href={profile.youtube_channel_url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1">
                    チャンネル: {profile.youtube_handle || profile.youtube_channel_id} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">YouTubeチャンネルと連携すると、公式認証バッジが付与されます。</p>
                <button type="button" onClick={handleGoogleLink} disabled={linkingGoogle} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                  {linkingGoogle ? '連携中...' : 'YouTubeと連携する'}
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('links')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'links'
                  ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              プロフィールリンク
            </button>
            <button
              onClick={() => setActiveTab('oshi')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'oshi'
                  ? 'border-b-2 border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Star className="w-4 h-4" />
              推しリンク (Favorite)
            </button>
          </div>

          {/* STANDARD LINKS TAB */}
          {activeTab === 'links' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">リンク管理</h1>
                <button onClick={() => setEditingLink({ isNew: true })} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> 新規追加
                </button>
              </div>

              {editingLink && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editingLink.isNew ? '新しいリンク' : 'リンク編集'}</h2>
                  <form onSubmit={handleSaveLink} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">タイトル</label>
                      <input type="text" value={editingLink.title || ''} onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                      <input type="url" value={editingLink.url || ''} onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">アイコン (Github, Twitter, Youtube等)</label>
                      <input type="text" value={editingLink.icon_key || ''} onChange={(e) => setEditingLink({ ...editingLink, icon_key: e.target.value || null })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="is_visible" type="checkbox" checked={editingLink.is_visible ?? true} onChange={(e) => setEditingLink({ ...editingLink, is_visible: e.target.checked })} className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                      <label htmlFor="is_visible" className="text-sm text-gray-700 dark:text-gray-300">公開する</label>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg">保存</button>
                      <button type="button" onClick={() => setEditingLink(null)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg">キャンセル</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {links.map((link) => (
                  <div key={link.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{link.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">{link.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleVisibility(link)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" title={link.is_visible ? '非表示' : '表示'}>
                        {link.is_visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                      <button onClick={() => setEditingLink(link)} className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200" title="編集">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200" title="削除">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {links.length === 0 && <div className="text-center py-8 text-gray-500">リンクがありません</div>}
              </div>
            </div>
          )}

          {/* OSHI LINKS TAB */}
          {activeTab === 'oshi' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">推しリンク管理</h1>
                  <p className="text-sm text-gray-500">好きなコンテンツ、推しの動画、おすすめ商品をカード形式で紹介できます。</p>
                </div>
                <button onClick={() => setEditingOshiLink({ isNew: true })} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> 新規追加
                </button>
              </div>

              {editingOshiLink && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editingOshiLink.isNew ? '新しい推しリンク' : '推しリンク編集'}</h2>
                  <form onSubmit={handleSaveOshiLink} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL (入力後に自動取得ボタンを押してください)</label>
                      <div className="flex gap-2">
                        <input type="url" value={editingOshiLink.url || ''} onChange={(e) => setEditingOshiLink({ ...editingOshiLink, url: e.target.value })} required placeholder="https://..." className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                        <button type="button" onClick={handleFetchOgp} disabled={ogpLoading || !editingOshiLink.url} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm font-medium flex items-center gap-2">
                          {ogpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '自動取得'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Preview Card */}
                    {(editingOshiLink.title || editingOshiLink.image_url) && (
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 flex gap-4">
                        <div className="w-24 h-24 bg-gray-100 flex-shrink-0 rounded-md overflow-hidden relative">
                           {editingOshiLink.image_url ? (
                             <img src={editingOshiLink.image_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <ImageIcon className="w-8 h-8 text-gray-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{editingOshiLink.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{editingOshiLink.description}</p>
                          <p className="text-xs text-blue-500 mt-1">{editingOshiLink.site_name}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">タイトル</label>
                      <input type="text" value={editingOshiLink.title || ''} onChange={(e) => setEditingOshiLink({ ...editingOshiLink, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">説明文</label>
                      <textarea value={editingOshiLink.description || ''} onChange={(e) => setEditingOshiLink({ ...editingOshiLink, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg">保存</button>
                      <button type="button" onClick={() => setEditingOshiLink(null)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg">キャンセル</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {oshiLinks.map((link) => (
                  <div key={link.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex gap-4 items-center group relative border border-transparent hover:border-pink-200 dark:hover:border-pink-900 transition-colors">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-md overflow-hidden flex-shrink-0">
                      {link.image_url ? (
                        <img src={link.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ExternalLink className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{link.title || link.url}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{link.description}</p>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block truncate max-w-full">{link.url}</a>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => setEditingOshiLink(link)} className="p-2 bg-gray-100 dark:bg-gray-600 rounded text-blue-600 hover:text-blue-800" title="編集"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteOshiLink(link.id)} className="p-2 bg-gray-100 dark:bg-gray-600 rounded text-red-600 hover:text-red-800" title="削除"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {oshiLinks.length === 0 && <div className="text-center py-8 text-gray-500">推しリンクがありません</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
