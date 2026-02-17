'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, GripVertical, Edit, Eye, EyeOff } from 'lucide-react'

interface LinkItem {
  id: string
  user_id: string
  title: string
  url: string
  icon_key: string | null
  sort_order: number
  is_visible: boolean
}

interface EditingLink extends Partial<LinkItem> {
  isNew?: boolean
}

export default function LinksManagePage() {
  const router = useRouter()
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLink, setEditingLink] = useState<EditingLink | null>(null)

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }

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
    loadLinks()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return

    const { error } = await supabase.from('links').delete().eq('id', id)
    if (error) {
      alert('エラーが発生しました: ' + error.message)
      return
    }
    loadLinks()
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
    loadLinks()
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              リンク管理
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
                    アイコンキー（任意: GitHub, Twitter, YouTube等）
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
  )
}
