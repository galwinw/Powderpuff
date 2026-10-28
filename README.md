# Powderpuff Playbook

Our flag football team's playbook app: animated plays, "my job" highlighting, positions, routes, rules and a Game Day call sheet. Coaches can edit plays and the roster right in the app.

**Live site:** https://galwinw.github.io/game1/

## What's inside

| Tab | What it does |
|---|---|
| **Offense / Special / Defense** | Every play, animated. Tap a player to see their job in plain words. Pick "Who are you?" once and your role is highlighted in every play. |
| **Learn** | Rules, a glossary, every position explained, and an animated route guide. |
| **Game Day** | Which play to call in each situation, plus a drive tracker (down, first downs, QB run used). |
| **Team** | Roster with positions, team settings, and coach login. |

The starter playbook is built around our rules: 7v7, two first downs per drive, one QB run per set of downs, no handoffs (pitches only), up to 2 no-hands blockers and 2 rushers, and anyone can block once the ball is caught or pitched.

- **Offense (everyday):** Slant-Flat, Bubble Screen, Mesh, Flood, Jet Pitch, Toss Sweep
- **Special:** Toss Bomb, Slip Screen, Center Pop, QB Sneak, Hook & Ladder
- **Defense:** 2-Rush Zone, Man + Safety

## Turning on cloud saving for coaches (one time, about 10 minutes)

Until this is set up, the app works fully but edits only save on the device that made them. To let coaches save changes for the whole team:

1. **Create a free Supabase project** at https://supabase.com (sign up → New project). Any name and region; save the database password somewhere.
2. **Create the table:** in the project, open **SQL Editor → New query**, paste everything from [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. **Only allow invited coaches:** go to **Authentication → Sign In / Providers** and turn **off** "Allow new users to sign up".
4. **Add each coach:** **Authentication → Users → Add user → Create new user**. Enter their email and a password, and tick "Auto Confirm User". Give them the login.
5. **Connect the app:** go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key into [`config.js`](config.js). (Or send them to Claude and it will do this part.) Both values are safe to publish: the database only lets logged-in coaches make changes.
6. Push the change. Coaches log in on the **Team** tab, and their edits reach everyone.

The first time a coach saves, the starter plays are copied to the cloud.

## How it's built

A plain static site with no build step: `index.html`, `css/app.css`, and ES modules in `js/`:

- `data.js`: starter playbook, positions, routes, rules and glossary
- `field.js`: field drawing and play animation
- `editor.js`: the coach play editor
- `store.js`: loading and saving (Supabase or this device)
- `app.js`: pages and navigation

GitHub Pages serves the site from the `gh-pages` branch. To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.
