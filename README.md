# PAWGRAM — SEE YOU OFFLINE · Season 1 (v3)

A full-colour manhwa site: 7 chapters, 69 pages, 6 mini-games, and one story that goes
from a 2:47 AM group chat to an afternoon under the sakura.

**This folder is the deployable root.** Drag it into Vercel (or `vercel --prod`) and it is live.
No build step, no dependencies, no backend.

```
/
├── index.html              ← home (hero, season cinema, cast, thread, chapters, motifs, arcade teaser, gallery, quiz, CTA)
├── gallery.html            ← film-strip ⇄ masonry + all 69 pages + lightbox
├── chapters.html           ← the 7 chapters
├── characters.html         ← cast bible
├── pawfun.html             ← 6 cabinets (Paw Catch, Konbini Rush, Quiz, Umbrella Dash, Frame 27, Mochi Clicker)
├── splash.html             ← PWA launch screen → index.html
├── readers/                ← Chapter_1..7_Reader.html (self-contained, art embedded)
├── pages/ch1..ch7/         ← the 69 manhwa pages as webp
├── art/                    ← cast art, gallery art, icons, favicon, og-cover.jpg
├── assets/css, assets/js   ← source CSS/JS (already inlined into the pages; kept for editing)
├── manifest.webmanifest
├── sw.js                   ← service worker (pawgram-v9)
├── vercel.json             ← clean URLs, redirects, cache headers
└── tools/                  ← build scripts (not needed at runtime, harmless to ship)
```

---

## Deploy to Vercel — 3 ways

### A. Drag & drop (fastest)
1. Unzip this folder.
2. Open <https://vercel.com/new> → **Deploy** → drag the **whole folder** onto the page.
3. Framework preset: **Other**. Build command: *empty*. Output directory: *empty*.
4. Deploy. Done.

> The domain will be `something.vercel.app`. If it is not `pawgram.vercel.app`, edit one line:
> `SITE = "https://pawgram.vercel.app"` in `tools/build_pages.py`, then run
> `python3 tools/build_pages.py` once more (that constant only feeds the `og:url` / `og:image`
> absolute URLs used by social crawlers — everything else is relative).

### B. Git (recommended, gives you previews + rollbacks)
```bash
git init
git add .
git commit -m "PAWGRAM v3 — full site upgrade"
git branch -M main
git remote add origin git@github.com:YOU/pawgram.git
git push -u origin main
```
Then in Vercel: **Add New → Project → import the repo → Framework: Other → Deploy.**
Every push after that is a new deployment; the previous one stays one click away.

### C. Vercel CLI
```bash
npm i -g vercel
cd pawgram
vercel --prod
```

### Updating an existing site
Vercel is immutable — you never "overwrite" files, you ship a new deployment.
Push the new files (or drag the new folder again) and Vercel promotes it. Rollback any time from
**Deployments → ⋯ → Promote**.

---

## After deploying — 60-second check

- [ ] `/` loads the hero, phone chat types, petals fall
- [ ] `/gallery` → toggle Film strip / Masonry → click a frame → lightbox opens, ←/→ works
- [ ] `/pawfun#play=mochi` → tap the cat 10 times → Paw points climb, first sticker unlocks
- [ ] `/readers/Chapter_2_Reader.html` → progress bar at the top fills as you scroll, resume pill appears on reload
- [ ] Day/night button in the nav flips the whole site
- [ ] Footer → **Reduce motion** stops everything
- [ ] Konami code (↑↑↓↓←→←→BA) → secret rain scene
- [ ] Install prompt appears in Chrome/Edge (PWA + service worker)

**Note:** the service worker is network-first for HTML, so the first visit after a deploy always
shows the new version. If you ever see a stale page, hard-reload once (the cached copy is the fallback).

---

## What needs a backend (UI + localStorage today)

| Feature | Storage key | Connect later |
|---|---|---|
| Season 2 notify email | `pg-notify` | Formspree / Supabase table |
| Reactions ❤️🥹🌸😭🐾 | `pg-reactions` | Supabase `reactions` + RPC |
| Arcade leaderboard | `pf-catch`…`pf-mochi` | Supabase `scores` |
| Reading progress | `pg-progress`, `pg-pos-N` | Supabase, keyed per device id |
| Badges / achievements | `pg-badges` | Supabase + keep localStorage fallback |
| Share result card | canvas → download/Web Share | same canvas → object storage |

Everything degrades silently: if `localStorage` is blocked (private mode, sandboxed iframe),
an in-memory fallback keeps the UI working.

---

## Editing the site (optional)

The shipped pages are fully self-contained (CSS/JS inlined). Source lives in `assets/`:

```bash
# edit assets/css/pg*.css or assets/js/pg-*.js, then rebuild the 5 pages:
python3 tools/build_pages.py

# the 7 readers are patched from _v2_backup/Chapter_N_Reader.html + pg-reader.{css,js}:
python3 tools/build_readers.py
```

`_v2_backup/` is the pristine v2 source of the readers. Keep it if you plan to rebuild them;
delete it if you only ever ship the built files (saves 7 MB).

See **NOTES_v3.md** for the full changelog, the easter-egg checklist and the design tokens.
