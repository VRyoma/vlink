# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**vbio** is a Link in Bio service for VTubers and content creators. Users can create a profile at `/{username}` that consolidates their social media, streaming, and merchandise links. The app features YouTube/Google OAuth integration with automatic channel verification - verified users receive a "verified badge" on their profile.

The application is in Japanese and the README is also in Japanese.

## Development Commands

```bash
# Start development server (runs on port 3001)
npm run dev

# Production build
npm run build

# Start production server (port 3001)
npm run start

# Lint code
npm run lint

# Build for Cloudflare Pages deployment
npm run pages:build

# Preview Cloudflare Pages build locally
npm run preview
```

## Architecture

### Tech Stack
- **Next.js 15.4.11** with App Router (not Pages Router)
- **Supabase** for authentication and PostgreSQL database
- **Tailwind CSS v4** for styling
- **TypeScript** with strict mode and `@/*` path aliases
- **Edge Runtime** for dynamic profile pages

### Application Structure

#### Routing
- `/` - Landing page
- `/{username}` - Dynamic user profile pages (uses Edge Runtime)
- `/admin` - Protected admin dashboard
- `/admin/login` - Login page
- `/admin/links` - Link management
- `/admin/profile` - Profile settings

#### Authentication Flow
Authentication uses Supabase Auth with Google/YouTube OAuth:

1. **Middleware** ([middleware.ts](middleware.ts)): Protects `/admin/*` routes, redirects unauthenticated users to `/admin/login`
2. **Server-side auth**: Use `checkAuth()` from [src/lib/auth.ts](src/lib/auth.ts) in server components
3. **Client-side auth**: Use the exported `supabase` client from [src/lib/supabase.ts](src/lib/supabase.ts)
4. **Login callback**: [src/app/admin/login/callback/route.ts](src/app/admin/login/callback/route.ts) handles OAuth callback, fetches YouTube channel data via `fetchYouTubeChannel()`, and updates/creates the user profile

#### Database Schema
Located in [supabase/migrations/](supabase/migrations/):

- **profiles**: User profiles with YouTube integration fields
  - `is_verified`: Set to true when user authenticates via Google/YouTube OAuth
  - `youtube_handle`, `youtube_channel_id`, `youtube_channel_url`: Populated during OAuth
  - `updated_at`: Auto-updated via trigger
- **links**: User links with visibility and sort order

TypeScript interfaces are in [src/types/supabase.ts](src/types/supabase.ts)

#### Key Libraries
- [src/lib/auth.ts](src/lib/auth.ts) - `checkAuth()`: Server-side auth check, redirects if unauthenticated
- [src/lib/supabase.ts](src/lib/supabase.ts) - Client Supabase instance for client components
- [src/lib/youtube.ts](src/lib/youtube.ts) - `fetchYouTubeChannel()`: Fetches channel data using OAuth access token
- [src/components/VerifiedBadge.tsx](src/components/VerifiedBadge.tsx) - Blue verified badge component for authenticated creators

### Deployment
The app is configured for Cloudflare Pages using `@cloudflare/next-on-pages`. The `next.config.ts` has minimal configuration as the adapter handles the build output. Currently deployed on a Proxmox LXC container with Caddy as a reverse proxy.

### Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Google/YouTube OAuth is configured in Supabase Auth settings.

### Common Patterns

#### Creating a Protected Admin Page
```typescript
// In any /admin/* server component
import { checkAuth } from '@/lib/auth'

export default async function Page() {
  const { user, supabase } = await checkAuth()
  // user and supabase are available
}
```

#### Dynamic Profile Pages
Dynamic routes at `/{username}` use Edge Runtime. The profile page fetches user data and displays their links with the verified badge if applicable.
