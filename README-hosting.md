# Hosting on Cloudflare Pages (free), git-connected

The app is a single `index.html`. Scores are shared for everyone via two tiny
Cloudflare Functions (`functions/api/results.js`, `functions/api/save.js`,
`functions/api/verify.js`) backed by a Cloudflare **KV** namespace. Admins edit
scores from any phone in Admin mode; everyone else just sees them. Cost: $0.

Unlike the original D9 bracket app (which uses Direct Upload — re-upload the
folder every time), this project is **connected to a GitHub repo**, so
Cloudflare Pages auto-builds and deploys on every `git push`.

## Project files
```
index.html                 # the app
functions/api/results.js   # GET /api/results  -> reads scores from KV (public)
functions/api/save.js      # POST /api/save     -> writes scores to KV (password)
functions/api/verify.js    # POST /api/verify   -> checks password, no write
```

## One-time Cloudflare setup

1. **Push this repo to GitHub first** (see `README.md` for the exact commands).

2. **Create the Pages project, connected to Git**
   - Cloudflare dashboard → *Workers & Pages* → **Create** → **Pages** →
     **Connect to Git** → pick this repo.
   - Build settings: no build command, no framework preset, output directory `/`.
   - Every push to `main` auto-deploys.

3. **Create a KV namespace**
   - *Workers & Pages → KV → Create namespace*, name it `RESULTS` (or reuse one
     across projects — namespaces aren't project-specific until bound).

4. **Bind the namespace to the project**
   - This project → *Settings → Functions (or Bindings) → KV namespace
     bindings → Add binding*.
   - **Variable name:** `RESULTS` → select the `RESULTS` namespace.
   - Add it for **Production** (and Preview if you use it).

5. **Set the admin password secret**
   - Project → *Settings → Variables and Secrets → Add* (encrypt / secret).
   - **Name:** `ADMIN_PASSWORD`  **Value:** a password you choose (can reuse
     the same one as the D9 site, or pick a new one).

6. **Custom domain**
   - Project → *Custom domains → Set up a domain* → e.g. `wa-state.ckang.dev`.
   - If `ckang.dev`'s DNS is on Cloudflare, it's one click. HTTPS is automatic.

7. **Redeploy** once after adding the binding/secret so the Functions pick them
   up (Deployments → ⋯ → Retry deployment, or push an empty commit).

## Using it
- Visit your custom domain. Scores load from `/api/results`.
- On your phone: ☰ → **Admin** → **Scores** tab → enter a score → **Save**.
  The first save prompts for the admin password (stored on that device after).
  The save publishes to KV, so everyone sees it.
- **Clear** removes a score and re-publishes.

## Updating the bracket data (git workflow)
Because this is git-connected, updating is just:
```bash
# edit index.html (e.g. fix a team name, add a division)
git add index.html
git commit -m "Fix team name"
git push
```
Cloudflare picks up the push and redeploys automatically — no manual re-upload.

## Updating scores from a scraper instead of by hand
Your scraper can publish directly without the UI — just POST the same JSON:
```bash
curl -X POST https://wa-state.ckang.dev/api/save \
  -H 'content-type: application/json' \
  -H "x-admin-password: YOUR_PASSWORD" \
  -d '{"stb910":{"4":[6,4]}}'
```
Format: `{ tournamentId: { gameNumber: [score1, score2] } }` where score1/score2
match the top/bottom team (`t1`/`t2`) of that game in the bracket. The app
computes winners and advances the bracket automatically.

## Local development
Opening `index.html` as a file or via a plain static server (no `/api`) just
works — it falls back to local-only scores in `localStorage`. The shared
behaviour only activates once the Functions + KV are live on Cloudflare.
