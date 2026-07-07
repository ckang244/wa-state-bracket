---
name: update-results
description: Fetch the official 9/10/11 Baseball WA State bracket PDF, read final scores, and publish them to the live wa-state.ckang.dev site. Triggers on "update results", "update scores", "fetch the latest bracket", "refresh the bracket", or running the nightly results update.
---

# Update the WA State bracket results from the official PDF

Reads the official 9/10/11 Baseball State Tournament bracket PDF, extracts
final scores for each completed game, and publishes the merged result set to
the live site (`https://wa-state.ckang.dev`). The site stores scores in
Cloudflare KV; this skill writes to KV via `POST /api/save`.

## Before you start

- **Admin password.** The POST is authenticated with the `ADMIN_PASSWORD`
  secret. Read it from the `WA_STATE_ADMIN_PASSWORD` environment variable. If
  it isn't set, ask the user for it once — do NOT hardcode it into any file.
- **Working dir is the repo.** `index.html` holds the `TOURNAMENTS` array
  (id `stb910`) with the game graph + team seeds. You need it to map PDF
  scores to game numbers.
- **PDFs can silently restructure mid-tournament** — not just fill in scores.
  Before mapping scores, diff the PDF's venue, dates, team list, and game count
  against the `index.html` model. If they diverge, the model needs to be
  rebuilt first (see the D9 bracket app's `sfjr-bracket-restructured` incident
  for what this looks like).

## Step 1 — Load the bracket model

Read `index.html` and extract the `stb910` tournament's `teams`, `init`, and
`advance`. Also note the `schedule` so you only look for scores in games whose
date is on or before today.

## Step 2 — Get the current published results (so you don't wipe anything)

`/api/save` REPLACES the whole KV value, so you must merge, not overwrite.

```
curl -s https://wa-state.ckang.dev/api/results
```

Parse that JSON as the starting point: `{ "stb910": { game: [s1,s2] } }`.

## Step 3 — Fetch the PDF and read the scores

The PDF lives at (re-fetch the index page below if this link 404s):
```
https://littleleaguewash.org/state-tournaments/2026-state-softball-baseball-tournament-brackets/
```
Current direct link (cache-bust with `?t=<epoch>`):
```
https://wad9spomirror.blob.core.windows.net/spomirror/d9/Postseason/Tournaments/2026/State/PDF/2026%209-10-11%20Baseball%20State.pdf
```

1. `WebFetch` the URL. **WebFetch's own text answer will say it can't read the
   PDF — ignore that.** It still saves the binary locally and prints the path
   (`…/tool-results/webfetch-*.pdf`). `Read` that path to view the bracket.
2. For every game that already has both teams known (from the model in Step 1
   plus scores you've already read this run), find that matchup on the
   bracket's clean **Results** table (not the jumbled bracket-graphic text) and
   read the final score. Record it as `[s1, s2]` where **s1 = the top team
   (`t1`) and s2 = the bottom team (`t2`)** of that game in the model — order
   matters, the site decides the winner from it.
3. Skip games with no score yet (not played) — leave them absent.
4. As you read winners, you can infer who advances to fill later games, which
   lets you align later-round matchups. (The site re-derives advancement
   itself, so you only need to publish the raw `[s1,s2]` per played game.)

Only read; never guess a score that isn't legible. If a score is unclear,
leave it out and note it for the user rather than inventing one.

## Step 4 — Merge and publish

Deep-merge the newly read scores into the Step 2 object (new/changed games
win; keep everything else). Then POST the FULL merged object:

```
curl -s -X POST https://wa-state.ckang.dev/api/save \
  -H 'content-type: application/json' \
  -H "x-admin-password: $WA_STATE_ADMIN_PASSWORD" \
  -d '<merged JSON>'
```

Expect `ok`. A `401` = wrong password; `503` = KV not bound (see
`README-hosting.md`); `400` = malformed body.

## Step 5 — Report

Tell the user concisely what changed, e.g. `G4: District 9 (Bellevue National)
6–3 District 5`, and flag any score you couldn't read. Don't dump the whole
JSON unless asked.

## Running it nightly

Use the `schedule` skill to create a nightly task that invokes
`/update-results` (e.g. every night at 11pm during the July 11–18 tournament
window). The run only happens while the Claude Code app is available to
execute the scheduled task.
