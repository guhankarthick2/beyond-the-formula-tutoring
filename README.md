# Beyond The Formula Tutoring

Free nonprofit precalculus tutoring app: volunteer tutors, curated topics, session booking, student requests, ephemeral chat, and text-only stuck-point Q&A.

**No photo uploads. No public email or personal contact details.**

## Stack

- Vite + React + TypeScript
- Supabase (Auth magic links, Postgres, Row Level Security, Realtime broadcast chat)
- Host free on Cloudflare Pages or Netlify

## Setup

### 1. Create a free Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** → paste and run `supabase/schema.sql`
3. **Authentication → Providers → Email**: enable email OTP / magic link
4. **Authentication → URL configuration**: set Site URL to your local or production URL (e.g. `http://localhost:5173`)

### 2. Configure the app

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

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Become admin

1. Sign in once (magic link)
2. Open **Admin** in the nav — it shows a SQL snippet with your user id
3. Run that update in Supabase SQL Editor
4. Refresh — you can approve tutors, moderate content, and edit topics

If you already ran an older `schema.sql`, also run  
`supabase/migrations/002_admin_moderation.sql` once for delete/purge tools.

### 5. Deploy (free)

**GitHub Pages (this repo):** pushes to `main` run `.github/workflows/deploy.yml`, which builds Vite and publishes `dist/`.

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions** (required once; branch/`/` serving of source will stay blank)
2. Optional: add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` so Auth/API work in production
3. Add `https://guhankarthick2.github.io/beyond-the-formula-tutoring` to Supabase Auth redirect URLs

**Other hosts:** `npm run build`, then publish `dist/` to [Cloudflare Pages](https://pages.cloudflare.com) or Netlify (set the same `VITE_*` env vars). For a root domain, leave Vite `base` as `/` (do not set `GITHUB_REPOSITORY` / `VITE_BASE_PATH`).

## Features

| Flow | Behavior |
|------|----------|
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
- Cloudflare Pages / Netlify: $0
- Supabase free tier: $0 until you outgrow limits

## Promote yourself to admin (manual)

```sql
update public.profiles
set role = 'admin', tutor_status = 'approved'
where id = 'YOUR_USER_UUID';
```
