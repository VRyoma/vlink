## Why

Google OAuth login is completely broken. After authenticating with Google, users are redirected to `/admin/login?error=auth_failed` instead of reaching the admin dashboard. The root cause is that the OAuth callback route (`src/app/admin/auth/callback/route.ts`) creates a Supabase client whose cookie `get()` method returns a `Promise` instead of a synchronous value. Since `@supabase/ssr` expects synchronous cookie access, `getUser()` always fails, triggering the `auth_failed` redirect.

## What Changes

- Fix the cookie handling in the OAuth callback route to use `await cookies()` and return values synchronously
- Align the callback route's Supabase client creation pattern with the working pattern already used in `middleware.ts` and `src/lib/auth.ts`
- Ensure the `set()` cookie handler also awaits correctly to persist session cookies

## Capabilities

### New Capabilities
- `oauth-callback`: Correct handling of OAuth callback flow — cookie read/write, session validation, YouTube data fetch, and redirect to admin.

### Modified Capabilities
<!-- No existing specs to modify (openspec/specs/ is empty) -->

## Impact

- `src/app/admin/auth/callback/route.ts` — Primary fix target (broken cookie handling)
- `middleware.ts` — Reference for correct cookie pattern (no changes expected)
- `src/lib/auth.ts` — Reference for correct cookie pattern (no changes expected)
