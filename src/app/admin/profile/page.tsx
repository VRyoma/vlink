'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, User, Eye, Palette, Image as ImageIcon, X } from 'lucide-react'
import MfmRenderer from '@/components/MfmRenderer'

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  theme_color: string | null
  background_url: string | null
  is_verified: boolean
  youtube_handle: string | null
  youtube_channel_id: string | null
  youtube_channel_url: string | null
  auth_provider: string
}

const PRESET_COLORS = [
  '#ffffff', // White
  '#f3f4f6', // Gray 100
  '#fee2e2', // Red 100
  '#ffedd5', // Amber 100
  '#fef9c3', // Yellow 100
  '#dcfce7', // Green 100
  '#d1fae5', // Emerald 100
  '#e0f2fe', // Blue 100
  '#e0e7ff', // Indigo 100
  '#ede9fe', // Violet 100
  '#fae8ff', // Fuchsia 100
  '#fce7f3', // Pink 100
]

export default function ProfileEditPage() {
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [themeColor, setThemeColor] = useState('#ffffff')
  const [backgroundUrl, setBackgroundUrl] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadProfile()
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
      setUsername(data.username || '')
      setDisplayName(data.display_name || '')
      setBio(data.bio || '')
      setAvatarUrl(data.avatar_url || '')
      setThemeColor(data.theme_color || '#ffffff')
      setBackgroundUrl(data.background_url || '')
    } else {
      const defaultUsername = user.user_metadata.username || `user_${user.id.slice(0, 5)}`
      setProfile({
        id: user.id,
        username: defaultUsername,
        display_name: user.user_metadata.display_name || '',
        bio: '',
        avatar_url: '',
        theme_color: '#ffffff',
        background_url: '',
        is_verified: false,
        youtube_handle: null,
        youtube_channel_id: null,
        youtube_channel_url: null,
        auth_provider: 'email'
      })
      setUsername(defaultUsername)
      setDisplayName(user.user_metadata.display_name || '')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    setMessage('')
    setErrorMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMessage('セッションが切れました。再ログインしてください。')
      setLoading(false)
      return
    }

    const updateData = {
      username: username || profile.username,
      display_name: displayName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      theme_color: themeColor,
      background_url: backgroundUrl || null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: profile.username || user.user_metadata.username,
          ...updateData
        }, { onConflict: 'id' })

      if (upsertError) {
        setErrorMessage('エラーが発生しました: ' + upsertError.message)
      } else {
        setMessage('プロフィールを保存しました！')
        setTimeout(() => setMessage(''), 3000)
      }
    } else {
      setMessage('プロフィールを保存しました！')
      setTimeout(() => setMessage(''), 3000)
    }

    setLoading(false)
    await loadProfile()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    const isAvatar = type === 'avatar'
    if (isAvatar) setUploadingAvatar(true)
    else setUploadingBg(true)
    
    setErrorMessage('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${type}-${Math.random()}.${fileExt}`
      const filePath = `user_assets/${fileName}`

      // Upload to 'avatars' bucket (reusing for all assets for now, or use generic 'uploads')
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (isAvatar) setAvatarUrl(publicUrl)
      else setBackgroundUrl(publicUrl)
      
      setMessage(`${isAvatar ? 'アイコン' : '背景'}をアップロードしました。保存ボタンを押すと確定します。`)
    } catch (error: any) {
      console.error('Upload error:', error)
      setErrorMessage('アップロードに失敗しました: ' + (error.message || '不明なエラー'))
    } finally {
      if (isAvatar) setUploadingAvatar(false)
      else setUploadingBg(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
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

          <form onSubmit={handleSave} className="space-y-8">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </button>
              </div>
              <input type="file" ref={avatarInputRef} onChange={(e) => handleFileUpload(e, 'avatar')} accept="image/*" className="hidden" />
              <p className="text-sm font-medium">プロフィール画像</p>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ユーザーID (URLに使用)</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" 
                  placeholder="your-id"
                />
                <p className="text-[10px] text-gray-500 mt-1">※IDを変更すると公開ページのURLも変わります</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">表示名</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">自己紹介 (MFM対応)</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" />
                {bio && (
                  <div className="mt-2 p-3 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Eye className="w-3 h-3"/>表示プレビュー</div>
                    <MfmRenderer text={bio} className="text-sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Background Customization */}
            <div className="space-y-4 border-t pt-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Palette className="w-5 h-5" />
                背景カスタマイズ
              </h2>

              {/* Background Color */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">背景色</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setThemeColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${themeColor === color ? 'border-purple-600 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              {/* Background Image */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">背景画像</label>
                {backgroundUrl ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                    <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setBackgroundUrl('')}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    disabled={uploadingBg}
                    className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm">{uploadingBg ? 'アップロード中...' : '背景画像をアップロード'}</span>
                  </button>
                )}
                <input type="file" ref={bgInputRef} onChange={(e) => handleFileUpload(e, 'background')} accept="image/*" className="hidden" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploadingAvatar || uploadingBg}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <Save className="w-5 h-5" />
              {loading ? '保存中...' : 'プロフィールを保存'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
