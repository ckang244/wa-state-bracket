# WA State Bracket — 9/10/11 Baseball

Live bracket for the 2026 Washington State Little League All-Star Tournament,
9/10/11 Baseball Division (Lynndale Park / Mukilteo Complex, District 1 host).
Same single-file app + Cloudflare Pages + KV pattern as the
[D9 bracket app](https://brackets.ckang.dev), but git-connected this time so
updates are a plain `git push` instead of a manual re-upload.

See [README-hosting.md](README-hosting.md) for the Cloudflare setup and the
update workflow.

## First-time setup (run these yourself — this environment's shell is broken)

```bash
cd /Users/chris/code/wa-state-bracket
git init
git add .
git commit -m "Initial commit: WA State 9-10-11 Baseball bracket"

# create the GitHub repo and push (requires gh CLI, or create it manually on github.com)
gh repo create wa-state-bracket --public --source=. --remote=origin --push
```

Then follow **README-hosting.md** to connect the repo to a new Cloudflare
Pages project, bind the `RESULTS` KV namespace, set the `ADMIN_PASSWORD`
secret, and point `wa-state.ckang.dev` at it.

## Updating the bracket after that
```bash
git add -A
git commit -m "..."
git push
```
Cloudflare auto-deploys on push — no dashboard steps needed for routine edits.
