# Powderpuff Playbook

Our flag football team's playbook app: animated plays, tap-a-player job highlighting, positions, routes, rules and a Game Day call sheet. Built to show on a big screen or iPad at practice. Coaches can draw and edit plays right in the app.

**Live site:** https://galwinw.github.io/Powderpuff/

## What's inside

| Tab | What it does |
|---|---|
| **Offense / Defense** | Offense is split into four playbooks (Pass, Pitch, Trick, QB Run). Every play is animated. Tap any player to highlight their route and see their job in plain words. Each side also has a Coaches playbook for plays the coaches draw. |
| **Learn** | Rules, a glossary, every position explained, and an animated route guide. |
| **Game Day** | Which play to call in each situation, plus a drive tracker (down, first downs, QB run used). |
| **Coach** | Coach mode, team name and league rules. |

The starter playbook is built around our rules: 7v7, two first downs per drive, one QB run per set of downs, no handoffs (pitches only), up to 2 no-hands blockers and 2 rushers, and anyone can block once the ball is caught or pitched.

- **Pass:** Slant-Flat, Curl-Flat, Double Slants, Mesh, All Go, Center Pop, Slip Screen
- **Pitch:** Jet Pitch, Toss Sweep, Counter Pitch
- **Trick:** Toss Bomb, Hook & Ladder, Flea Flicker, Reverse
- **QB Run:** QB Sneak, QB Draw, QB Bootleg
- **Defense:** 2-Rush Man (base), Middle Blitz (our one blitz per set of downs)

## Team database and coach mode

The app saves plays and team settings to a free Supabase database, so changes show up for everyone. It runs on the honor system: there are no logins.

- **Coach mode:** on the **Coach** tab, pick your name (Galwin, Luan or Wyatt) and turn on coach mode. That lets you draw new plays, change plays, and update the team name and rules.
- **Bylines:** new plays show who made them ("Galwin's play"), and edits to someone else's play show who changed it.
- **Saving merges:** every save starts from the newest copy in the database, so two coaches saving at the same time don't wipe out each other's changes.

**Setup (already done for this team):**
1. Create a free project at https://supabase.com.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
3. Put the **Project URL** and the **publishable (anon) key** into [`config.js`](config.js). Never put the secret / service_role key in the app.

If `config.js` is left blank, the app still works, but edits only save on the device that made them.

## How it's built

A plain static site with no build step: `index.html`, `css/app.css`, and ES modules in `js/`:

- `data.js`: starter playbook, positions, routes, rules and glossary
- `field.js`: field drawing and play animation
- `editor.js`: the coach play editor
- `store.js`: loading and saving (Supabase or this device)
- `app.js`: pages and navigation

GitHub Pages serves the site from the `gh-pages` branch. Before each deploy, run `python3 tools/stamp.py` so browsers load the new files instead of old cached copies. To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.
