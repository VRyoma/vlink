## Context

The OAuth callback route (`src/app/admin/auth/callback/route.ts`) creates a Supabase server client with cookie handlers that use `cookies().then(...)` — returning Promises from what `@supabase/ssr` expects to be synchronous accessors. This means:

1. `get()` returns a Promise instead of `string | undefined` → `getUser()` can never read session cookies → always returns null
2. `set()` fires-and-forgets via `.then()` → cookies may not be set before the response is sent

The working patterns already exist in the codebase:
- `middleware.ts` uses `request.cookies.get(name)?.value` (synchronous, correct)
- `src/lib/auth.ts` uses `const cookieStore = await cookies()` then accesses it synchronously (correct)

## Goals / Non-Goals

**Goals:**
- Fix the callback route so Google OAuth login succeeds end-to-end
- Align cookie handling with the pattern already established in `src/lib/auth.ts`
- Preserve the existing YouTube channel data fetch on login

**Non-Goals:**
- Refactoring the overall auth architecture
- Adding new auth providers
- Fixing unrelated `any` types in cookie options (separate change)

## Decisions

### Decision 1: Use `await cookies()` pattern from `src/lib/auth.ts`

**Approach:** Hoist `const cookieStore = await cookies()` before creating the Supabase client, then reference `cookieStore` synchronously in the cookie handlers — exactly as `src/lib/auth.ts` already does.

**Why not the middleware pattern:** Middleware receives a `NextRequest` with `.cookies` already available. Route handlers don't have this; they must use `cookies()` from `next/headers`.

**Why not keep `.then()`:** `@supabase/ssr`'s `CookieMethodsServer.get()` expects `string | undefined`, not `Promise<string | undefined>`. The async version silently breaks.

### Decision 2: Add `remove()` handler

The current callback route is missing a `remove()` cookie handler entirely. While `set()` and `get()` are the primary concern, adding `remove()` ensures full compatibility with Supabase's cookie management (e.g., on sign-out from within the callback context).

## Risks / Trade-offs

- **Low risk:** This is a targeted fix to one file, following an established pattern already working in the same codebase.
- **Cookie timing:** After fixing `set()` to be synchronous, cookies will be set before the redirect response is sent, which is the correct behavior.
- **No migration needed:** This is a bug fix, not a schema or data change.
