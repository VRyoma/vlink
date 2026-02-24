import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Link as LinkIcon, ExternalLink } from 'lucide-react'

interface OshiLink {
  id: string
  url: string
  title: string | null
  description: string | null
  image_url: string | null
  site_name: string | null
}

interface OshiLinksListProps {
  userId: string
  className?: string
}

export async function OshiLinksList({ userId, className = '' }: OshiLinksListProps) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  const { data: oshiLinks } = await supabase
    .from('oshi_links')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (!oshiLinks || oshiLinks.length === 0) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      <h3 className="text-sm font-bold text-gray-500 mb-3 px-1">
        Favorites / Oshi
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {oshiLinks.map((link: OshiLink) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white/60 hover:bg-white backdrop-blur-sm rounded-xl overflow-hidden border border-white/40 shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5"
          >
            {/* OGP Image Preview */}
            <div className="relative w-full h-32 bg-gray-100 overflow-hidden">
              {link.image_url ? (
                <img
                  src={link.image_url}
                  alt={link.title || link.url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <LinkIcon className="w-8 h-8 opacity-20" />
                </div>
              )}
              {/* Site Name Badge */}
              {link.site_name && (
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md">
                  {link.site_name}
                </span>
              )}
            </div>
            
            {/* Content */}
            <div className="p-3">
              <h4 className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                {link.title || link.url}
              </h4>
              {link.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                  {link.description}
                </p>
              )}
              <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate">{new URL(link.url).hostname}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
