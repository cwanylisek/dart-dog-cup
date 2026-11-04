# Dart Dog Cup

A mobile-first PWA for darts: an X01 score counter with checkout suggestions, plus a round-robin league with a live table and schedule.

## Features

- **Counter**: 501 / 301, double-out, legs and sets. You enter each dart (Double / Treble + number, 25, Bull, Miss) and can undo any dart.
- **Checkout hints**: the best finish for the darts left in the turn, or a setup shot that leaves a good double (e.g. `S13 → leave 32`). The suggested target is highlighted on the keypad.
- **Stats**: 3-dart average, first-9 average, checkout %, 100+/140+/180s, highest finish, best leg.
- **League**: round-robin schedule (single or double round), configurable points per leg won and match-win bonus, and a live table. Ties are broken by matches won, then leg difference, then head-to-head.
- **Play this match**: start a league fixture from the schedule. When you save it, the result is recorded automatically.
- Voice caller, keep-screen-awake, dark and light themes, English and Polish.

## Development

```bash
npm install
npm run dev        # http://localhost:5173 (also exposed on your LAN for phone testing)
npm test           # engine unit tests
npm run build      # production build in dist/
```

Without Supabase keys the app runs in **local mode**: everything is stored on the device and no PIN is needed.

## Supabase setup (shared league)

1. Create a free project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql) and run it.
3. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings → API**:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. The default admin PIN is **1234**. Change it in the app under **Settings → Change PIN**.

Anyone with the link can view the league. Changes (players, results, settings, saving matches) need the admin PIN, which is checked on the server.

## Deploying to GitHub Pages

1. Push the repo to GitHub (`main` branch).
2. **Settings → Pages → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Every push to `main` runs the tests, then builds and deploys to `https://<user>.github.io/<repo>/`.

The base path is set from the repo name automatically. The app uses hash routing, so GitHub Pages works without extra config.

## Install on a phone

- **iPhone (Safari)**: Share → Add to Home Screen
- **Android (Chrome)**: ⋮ → Install app

## Project structure

```
src/
  engine/      pure TS: darts, checkout engine, X01 scoring, league (with tests)
  data/        repository layer: local (localStorage) and remote (Supabase RPC)
  store/       zustand stores: data (with offline queue), game, prefs, ui
  pages/       counter, league, players, settings
  components/  UI kit (AppShell + burger menu, Sheet, Segmented, ...)
  i18n/        en / pl
supabase/schema.sql
```

## Regenerating icons

Edit `public/logo.svg`, then run `npm run generate-icons`.
