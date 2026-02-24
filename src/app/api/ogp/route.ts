import { NextResponse } from 'next/server'
import ogs from 'open-graph-scraper'

export const runtime = 'nodejs' 

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const { result } = await ogs({ url: url })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to fetch OGP' }, { status: 400 })
    }

    // Safely extract image
    let image = null
    if (result.ogImage && result.ogImage.length > 0) {
      image = result.ogImage[0].url
    } else if (result.twitterImage && result.twitterImage.length > 0) {
      image = result.twitterImage[0].url
    }

    return NextResponse.json({
      title: result.ogTitle || result.twitterTitle,
      description: result.ogDescription || result.twitterDescription,
      image: image,
      site_name: result.ogSiteName || new URL(url).hostname,
    })
  } catch (error) {
    console.error('OGP Fetch Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
