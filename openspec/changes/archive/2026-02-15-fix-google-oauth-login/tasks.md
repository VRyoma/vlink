## 1. Fix Cookie Handling in Callback Route

- [x] 1.1 Hoist `const cookieStore = await cookies()` before `createServerClient()` in `src/app/admin/auth/callback/route.ts`
- [x] 1.2 Rewrite cookie `get()` to return `cookieStore.get(name)?.value` synchronously
- [x] 1.3 Rewrite cookie `set()` to call `cookieStore.set({ name, value, ...options })` synchronously with `httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'`
- [x] 1.4 Add cookie `remove()` handler that sets the cookie to empty with `maxAge: 0`

## 2. Verify

- [x] 2.1 Run `npm run build` to confirm no TypeScript or build errors
- [ ] 2.2 Manually test Google OAuth login flow end-to-end on deployed site
