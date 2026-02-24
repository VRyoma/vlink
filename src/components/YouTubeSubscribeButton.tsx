'use client'

import { Youtube } from 'lucide-react'

interface YouTubeSubscribeButtonProps {
  channelUrl: string
  handle?: string
  subscriberCount?: number | null
  className?: string
}

export function YouTubeSubscribeButton({ 
  channelUrl, 
  handle, 
  subscriberCount,
  className = '' 
}: YouTubeSubscribeButtonProps) {
  
  // Create subscribe link
  const subscribeUrl = `${channelUrl}?sub_confirmation=1`
  
  const formattedCount = subscriberCount 
    ? new Intl.NumberFormat('ja-JP', { notation: "compact", maximumFractionDigits: 1 }).format(subscriberCount)
    : null

  return (
    <a
      href={subscribeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-2 
        bg-[#ff0000] text-white 
        px-4 py-2 rounded-full 
        font-bold text-sm 
        hover:bg-[#cc0000] 
        transition-colors shadow-md 
        ${className}
      `}
    >
      <Youtube className="w-5 h-5 fill-current" />
      <span>チャンネル登録</span>
      {formattedCount && (
        <span className="bg-black/20 px-2 py-0.5 rounded text-xs ml-1">
          {formattedCount}
        </span>
      )}
    </a>
  )
}
