import { supabase } from '@/lib/supabase'
import { Link as LinkType, Profile } from '@/types/supabase'
import { Link } from 'lucide-react'

export default async function Home() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .single()

  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="max-w-md mx-auto px-6 py-12">
        {profiles && (
          <div className="flex flex-col items-center gap-6">
            {profiles.avatar_url && (
              <img
                src={profiles.avatar_url}
                alt={profiles.display_name || profiles.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            )}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profiles.display_name || profiles.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                @{profiles.username}
              </p>
              {profiles.bio && (
                <p className="text-gray-700 dark:text-gray-400 mt-3 px-4">
                  {profiles.bio}
                </p>
              )}
            </div>
          </div>
        )}

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
