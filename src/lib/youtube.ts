import { createClient } from '@supabase/supabase-js'

interface YouTubeChannelResponse {
  items: Array<{
    id: string
    snippet: {
      title: string
      customUrl?: string
    }
  }>
}

/**
 * Fetch YouTube channel data using OAuth access token
 */
export async function fetchYouTubeChannel(accessToken: string): Promise<{
  channelId: string
  handle?: string
  customUrl?: string
}> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch YouTube channel')
    }

    const data: YouTubeChannelResponse = await response.json()
    const channel = data.items[0]

    return {
      channelId: channel.id,
      handle: channel.snippet.customUrl,
      customUrl: channel.snippet.customUrl,
    }
  } catch (error) {
    console.error('Error fetching YouTube channel:', error)
    throw error
  }
}
