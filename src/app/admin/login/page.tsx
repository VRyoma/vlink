'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Check for error param from failed OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'auth_failed') {
      setError('ログインに失敗しました。もう一度お試しください。')
    }
    // Show success message if registered
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('登録完了しました。ログインしてください。')
    }
  }, [searchParams])

  // Handle OAuth callback from hash fragment
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if we have tokens in the URL hash (from OAuth redirect)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        setLoading(true)
        try {
          // Parse the hash fragment to get tokens
          const params = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const providerToken = params.get('provider_token')
          const expiresIn = params.get('expires_in')

          if (accessToken) {
            // Set the session using the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })

            if (error) {
              console.error('Session error:', error)
              setError('ログインに失敗しました')
              setLoading(false)
              return
            }

            // Clear the hash from URL
            window.history.replaceState({}, document.title, window.location.pathname)

            // Fetch YouTube data if we have provider token
            if (providerToken) {
              try {
                const youtubeData = await fetchYouTubeChannel(providerToken)
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                  await supabase.from('profiles').upsert({
                    id: user.id,
                    is_verified: true,
                    youtube_channel_id: youtubeData.channelId,
                    youtube_handle: youtubeData.handle,
                    youtube_channel_url: `https://www.youtube.com/channel/${youtubeData.channelId}`,
                    auth_provider: 'google',
                    updated_at: new Date().toISOString(),
                  })
                }
              } catch (error) {
                console.error('Failed to fetch YouTube channel:', error)
              }
            }

            // Redirect to admin page
            router.push('/admin')
          }
        } catch (err) {
          console.error('OAuth callback error:', err)
          setError('ログイン処理中にエラーが発生しました')
        } finally {
          setLoading(false)
        }
      }
    }

  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
          管理画面ログイン
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            アカウントをお持ちでないですか？{' '}
            <a href="/admin/register" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
              新規登録
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
