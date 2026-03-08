# Natestagram

A personal Instagram alternative focused on your photos only: no likes, no comments, no social chrome.

## Stack

- Next.js (App Router, TypeScript)
- Supabase Postgres + Storage
- Vercel deployment

## Features

- Responsive photo grid homepage
- Fullscreen post route with swipeable photo carousel and full caption display
- Admin upload page with password gate and multi-photo post upload
- Supabase-backed storage and metadata

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.example .env.local
```

3. Fill `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=photos
# you can use either variable name; ADMIN_SECRET_CODE is preferred
ADMIN_SECRET_CODE=choose-a-strong-secret
# legacy name still supported:
# ADMIN_UPLOAD_PASSWORD=choose-a-strong-secret
```

4. In Supabase SQL editor, run `supabase/schema.sql`.

5. Create a public storage bucket named `photos` (or set `SUPABASE_STORAGE_BUCKET` to your bucket name).

6. Start development server:

```bash
npm run dev
```

7. Open `http://localhost:3000`.

## Routes

- `/` photo grid
- `/photo/[id]` fullscreen post carousel + caption
- `/admin` upload form

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add all env vars from `.env.example` in Vercel Project Settings.
4. Attach your custom domain in Vercel.
5. Deploy.

## Notes

- Home page gracefully shows an empty state if Supabase env vars are not set.
- Service role key is used only in server actions for admin uploads.
