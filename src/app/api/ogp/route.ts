import { NextResponse } from 'next/server'

export const runtime = 'edge'

function decodeHTMLEntities(text: string) {
  if (!text) return ''
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    try {
      new URL(targetUrl)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
      },
      redirect: 'follow',
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL (${response.status})` }, { status: 400 })
    }

    const html = await response.text()

    const getMetaTag = (name: string) => {
      // name or property
      const regex = new RegExp(`<meta(?:\\s+[^>]*)*(?:name|property)=['"]${name}['"](?:\\s+[^>]*)*content=['"]([^'"]*)['"]`, 'i')
      const match = html.match(regex)
      if (match) return match[1]
      
      const regexReverse = new RegExp(`<meta(?:\\s+[^>]*)*content=['"]([^'"]*)['"](?:\\s+[^>]*)*(?:name|property)=['"]${name}['"]`, 'i')
      const matchReverse = html.match(regexReverse)
      return matchReverse ? matchReverse[1] : null
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    
    const title = getMetaTag('og:title') || getMetaTag('twitter:title') || (titleMatch ? titleMatch[1] : '')
    const description = getMetaTag('og:description') || getMetaTag('twitter:description') || getMetaTag('description') || ''
    const image = getMetaTag('og:image') || getMetaTag('twitter:image') || ''
    const site_name = getMetaTag('og:site_name') || new URL(targetUrl).hostname

    return NextResponse.json({
      title: decodeHTMLEntities(title),
      description: decodeHTMLEntities(description),
      image: decodeHTMLEntities(image),
      site_name: decodeHTMLEntities(site_name),
    })
  } catch (error: any) {
    console.error('OGP Fetch Error:', error)
    return NextResponse.json({ error: 'Internal Server Error: ' + (error.message || '') }, { status: 500 })
  }
}
