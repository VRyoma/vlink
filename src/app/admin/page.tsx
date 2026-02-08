import { checkAuth } from '@/lib/auth'
import Link from 'next/link'
import { User, Settings, Link as LinkIcon } from 'lucide-react'

export default async function AdminDashboard() {
  const { user, supabase } = await checkAuth()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            管理ダッシュボード
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ようこそ、{profile?.display_name || profile?.username}さん
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/admin/profile"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  プロフィール編集
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  表示名、自己紹介、アイコンを設定
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/links"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <LinkIcon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  リンク管理
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {links?.length || 0}個のリンク
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                公開ページ
              </h2>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-300 hover:underline mt-1 inline-block"
              >
                bio.vvil.jp を見る →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
