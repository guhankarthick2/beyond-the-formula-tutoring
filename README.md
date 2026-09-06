# Beyond The Formula Tutoring

Free nonprofit precalculus tutoring app: volunteer tutors, curated topics, session booking, student requests, ephemeral chat, and text-only stuck-point Q&A.

**No photo uploads. No public email or personal contact details.**

## Stack

- Vite + React + TypeScript
- Supabase (Auth: Google OAuth + email/password, Postgres, Row Level Security, Realtime broadcast chat)
- Host free on GitHub Pages, Cloudflare Pages, or Netlify

## Setup

### 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** → paste and run `supabase/schema.sql`
3. If the project already existed, also run newer migrations under `supabase/migrations/` (including `004_auth_display_name_fallbacks.sql`)

### 2. Configure Auth (required for secure sign-in)

#### Email / password
1. **Authentication → Providers → Email**: enable Email provider
2. Turn **Confirm email** ON for new registrations
3. Leave magic-link/OTP optional (the app uses password + Google)

#### Google OAuth
1. Create an OAuth 2.0 Client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Web application)
2. Authorized JavaScript origins: `http://localhost:3001` and `https://beyondtheformula.org`
3. Authorized redirect URIs: your Supabase callback  
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. **Authentication → Providers → Google**: enable, paste Client ID and Client Secret

#### URL configuration
**Authentication → URL configuration**
- **Site URL** (production): `https://beyondtheformula.org`
- **Redirect URLs** allow list (one per line):
  - `http://localhost:3001/**`
  - `https://beyondtheformula.org/**`
  - `https://www.beyondtheformula.org/**`

Keep **Site URL** on the custom domain (not localhost). Localhost belongs only in the redirect allow list for local dev.

#### Session / JWT (token refresh without constant re-login)
**Authentication → Sessions** (or JWT settings, depending on dashboard version):
- **JWT expiry**: `14400` seconds (**4 hours**) — short-lived access token
- **Refresh / session inactivity**: about **7 days** — silent refresh keeps users signed in while they work; after ~a week idle they sign in again

#### Google OAuth branding verification tips
- Keep the OAuth **App name** exactly **Beyond The Formula** (same as the home page H1).
- After deploy, confirm these load **without signing in**:
  - Home: `https://beyondtheformula.org/`
  - Privacy: `https://beyondtheformula.org/privacy/`
  - Terms: `https://beyondtheformula.org/terms/`
- **Ownership:** verify `beyondtheformula.org` in [Google Search Console](https://search.google.com/search-console) (Domain property + DNS TXT, or URL-prefix + HTML meta already in `index.html`).
- Pages source must stay **GitHub Actions** (not “Deploy from a branch”), or the site goes blank again.

```bash
cp .env.example .env
```

Fill in:

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` key |
| `VITE_VOLUNTEER_INTRO_VIDEO_URL` | YouTube embed URL for your tutor intro |
| `VITE_YOUTUBE_CHANNEL_URL` | Your channel URL |

### 4. Run locally

```bash
npm install
npm run dev
```

### 5. Become admin

1. Sign in once (Google or email/password)
2. Open **Admin** in the nav — it shows a SQL snippet with your user id
3. Run that update in Supabase SQL Editor
4. Refresh — you can approve tutors, moderate content, and edit topics

If you already ran an older `schema.sql`, also run newer files under `supabase/migrations/` as needed  
(including `005_allow_sql_editor_profile_bootstrap.sql` and `006_fix_slots_bookings_rls_recursion.sql`).

### 6. Deploy (free)

**GitHub Pages (this repo):** pushes to `main` run `.github/workflows/deploy.yml`, which builds Vite and publishes `dist/`.

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions** (required once; branch/`/` serving of source will stay blank)
2. Add **repository** Actions secrets (not only the `github-pages` environment):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`  
   Path: **Settings → Secrets and variables → Actions → Repository secrets**  
   Vite embeds these at **build** time; the build job cannot see environment-only secrets.
3. Re-run **Deploy GitHub Pages** (or push to `main`) after adding/changing secrets
4. Keep the production URL in Supabase Auth Site URL + Redirect allow list (see above)

**Other hosts:** `npm run build`, then publish `dist/` to [Cloudflare Pages](https://pages.cloudflare.com) or Netlify (set the same `VITE_*` env vars). For a root domain, leave Vite `base` as `/` (do not set `GITHUB_REPOSITORY` / `VITE_BASE_PATH`).

## Security notes

- **RLS is the real lock** — UI routes are not security boundaries
- Browser only uses the **anon** key + the user’s session; never ship the service role key
- Passwords are stored by Supabase Auth (hashed), not in `profiles`
- Access JWTs rotate about every 4 hours; refresh is automatic until the ~7-day session ends
- Prefer Google for students when possible (no password to phish); email/password supports forgot-password recovery

## Features

| Flow | Behavior |
|------|----------|
| Auth | Google OAuth or email/password; register, sign-in, forgot password |
| Volunteer | Watch intro video → accept expectations → apply → admin approve |
| Availability | Tutor posts date + curated topic or “Any topic” |
| Book | Students book open slots |
| Request | Students request topic + date even if recordings exist; tutors claim & propose |
| Chat | Supabase Realtime broadcast — **not stored** |
| Stuck points | Text Q&A on curated topics only |
| Admin | Approve/revoke tutors, rename sign-ups, cancel/delete requests, close/delete stuck threads, purge old data |

## Privacy

- Public UI uses **display names only**
- Email is for login only (never shown on profiles)
- Chat warns against sharing personal contact info
- No image storage

## Costs

Typical early usage stays on free tiers:

- Domain ~$10–15/year (optional)
- GitHub Pages / Cloudflare Pages / Netlify: $0
- Supabase free tier: $0 until you outgrow limits

## Promote yourself to admin (manual, first admin only)

The **first** admin still needs a one-time SQL promote. After that, use **Admin → Admins** in the app to search users and grant admin access. Also run migration `009_admin_set_role.sql` so in-app promotion works.

Admin and mentor are separate. Promoting to admin does **not** make you a tutor. Enable mentoring later from **Admin → Tutor apps** if you want the mentor dashboard.

```sql
-- Run migration 005 once (or the function body in supabase/migrations/005_*.sql), then:
update public.profiles
set role = 'admin'
where id = 'YOUR_USER_UUID';
```

Or in one SQL Editor batch without the migration:

```sql
select set_config('app.allow_tutor_apply', 'on', true);

update public.profiles
set role = 'admin'
where id = 'YOUR_USER_UUID';
```
