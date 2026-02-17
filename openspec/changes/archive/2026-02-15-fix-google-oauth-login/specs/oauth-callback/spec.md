## ADDED Requirements

### Requirement: Callback route reads session cookies synchronously

The OAuth callback route handler SHALL create a Supabase server client whose cookie `get()` method returns a synchronous `string | undefined` value, not a Promise.

#### Scenario: Successful cookie read after OAuth redirect

- **WHEN** a user is redirected to `/admin/auth/callback` after Google OAuth authentication
- **THEN** the callback route SHALL read session cookies synchronously using `await cookies()` hoisted before client creation
- **AND** `supabase.auth.getUser()` SHALL return the authenticated user

### Requirement: Callback route sets session cookies synchronously

The OAuth callback route handler SHALL set cookies synchronously so that they are included in the response before the redirect.

#### Scenario: Cookies persisted before redirect

- **WHEN** the Supabase client sets session cookies during the callback
- **THEN** the `set()` handler SHALL write cookies to the awaited cookie store synchronously
- **AND** the cookies SHALL include `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, and `path: '/'`

### Requirement: Callback route removes cookies when requested

The OAuth callback route handler SHALL support cookie removal via a `remove()` handler.

#### Scenario: Cookie removal sets maxAge to zero

- **WHEN** the Supabase client requests cookie removal
- **THEN** the `remove()` handler SHALL set the cookie value to empty string with `maxAge: 0`

### Requirement: Successful login redirects to admin dashboard

After successful authentication, the callback route SHALL redirect the user to the admin dashboard.

#### Scenario: Authenticated user reaches admin

- **WHEN** `supabase.auth.getUser()` returns a valid user
- **THEN** the route SHALL redirect to `/admin`

#### Scenario: Authentication failure redirects to login with error

- **WHEN** `supabase.auth.getUser()` returns an error or no user
- **THEN** the route SHALL redirect to `/admin/login?error=auth_failed`

### Requirement: YouTube channel data fetched on login with provider token

When a Google OAuth session includes a `provider_token`, the callback SHALL attempt to fetch YouTube channel data and update the user profile.

#### Scenario: Provider token present

- **WHEN** `session.provider_token` is available after successful authentication
- **THEN** the route SHALL call `fetchYouTubeChannel()` with the provider token
- **AND** upsert the user's profile with `is_verified: true`, `youtube_channel_id`, `youtube_handle`, and `youtube_channel_url`

#### Scenario: YouTube fetch failure is non-blocking

- **WHEN** `fetchYouTubeChannel()` throws an error
- **THEN** the route SHALL log the error and continue redirecting to `/admin`
- **AND** the login SHALL NOT fail due to YouTube API errors
