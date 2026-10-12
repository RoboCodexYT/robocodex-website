# robocodex.github.io

this is the site for **RoboCodex**, a free resource for students getting into FIRST Tech Challenge robotics, built by me, **Jose Laurencio**.

This site is where i put everything i wish someone had handed me: videos, written guides, calculators, and a curated list of the tools and docs actually worth using.

## what's on the site

| page | what it is |
|---|---|
| home | `index.html` — the pitch, featured videos, an animated FTC field, calculator previews, and match breakdown teaser |
| videos | `content.html` — youtube videos, shorts, and instagram carousels in one library, with type tabs, search, and a swipeable carousel viewer |
| robot doctor | `doctor.html` — describe a symptom, answer a few questions, get ranked likely causes with fixes, code, and sources. also has a status light decoder and a pre-match checkup |
| guides | `guides.html` — readable-inline FTC guides (encoders, PID tuning, etc.) with a knowledge map and a listen button |
| resources | `resources.html` — a curated directory of official FIRST docs, programming libraries, CAD parts, scouting sites, and channels |
| stats | private — team-24813 season stats and match breakdowns, gated behind a passcode and removed from all navigation |
| about | `about.html` — who i am and why this exists |
| calculators | `calculators.html` — gear ratio, drivetrain speed, and encoder distance tools |
| bookmarks | `bookmarks.html` — save videos and resources locally in your browser |

## robot doctor

`doctor.html` is a symptom checker for FTC robots. the knowledge base (`js/doctor-data.js`) has 31 symptoms, 79 causes, and 95 questions, all sourced from FIRST's FTC docs, REV, GM0, Pedro Pathing, and the community — see `docs/robot-doctor-research.md`. the engine (`js/doctor-engine.js`) does a bayesian-style update after each answer and picks the next question by expected information gain, cheapest checks first. every diagnosis lives in the url, so it can be shared.

## the ftc toolkit

a few interactive tools live in their own pages — no backend, all client-side.

- **path visualizer** (`path-viz.html`) — plan an autonomous route on a 12x12 FTC field, paste your own points, and watch a robot run it
- **pid tuner** (`tuner.html`) — tune PIDF gains against a simulated motor on a virtual bench, then copy them straight into a `PIDFCoefficients` line
- **animated field** (`app/components/field-svg.js`) — a tiny reusable SVG field component used on the home page and the visualizer
- **lost robot 404** (`404.html`) — the robot drives off the field looking for the page that doesn't exist

## the little things that work

- dark mode by default (League Spartan, RoboCodex blues), light mode toggle that remembers your choice
- cards and sections rise in as you scroll, staggered per row, the field robot starts driving when it comes into view — and the whole thing stands down if you prefer reduced motion
- everything reads fine on a phone (the nav folds into a menu button, grids reflow)
- videos, resources, and guides are all bookmarkable without signing in
- deep links like `guides.html#guide-pid-tuning` open a guide directly
- guides read themselves out loud with the browser's speech synth (the listen button)
- the whole site is a PWA — install it to your home screen and it works fully offline
- guides, videos, resources, and paths all live in `data/*.json` so updating content means editing a file, not a template

## how it's built

plain html, css, and a bit of vanilla js. no framework, no build step, no backend — the site is static and hosted free on GitHub Pages.

## running it locally

the site is static, so any server works:

```sh
python3 -m http.server 8000
```

then open `http://localhost:8000`. the service worker registers itself and caches the whole site, so a second visit works offline.

## how the video library stays updated

`.github/workflows/update-videos.yml` runs every hour:

- `scripts/update-videos.mjs` reads the youtube channel feed, tags each upload as a video or a short, and merges it into `data/videos.json` (the feed only lists the newest 15, so older uploads are kept, not dropped)
- `scripts/update-instagram.mjs` pulls **carousel posts only** from instagram into `data/instagram.json` and downloads every slide into `images/instagram/<post id>/`, since instagram's image links expire
- it only commits when something actually changed

instagram needs two repo secrets (Settings → Secrets and variables → Actions):

- `IG_ACCESS_TOKEN`: a long-lived token from the Instagram API with Instagram Login (the account has to be a creator or business account)
- `SECRETS_PAT`: a fine-grained github token with "Secrets: read and write" on this repo, so `refresh-instagram-token.yml` can renew the instagram token every week before its 60 days run out

without them the youtube side still works and instagram just gets skipped.

## seo

`npm run seo` (scripts/seo.mjs) owns everything search engines and link previews see: titles, descriptions, canonical urls, open graph / twitter cards, structured data, and noindex on private pages (stats, match breakdowns, bookmarks). it also writes a static, crawlable guide for every robot doctor symptom into `fix/`, plus `sitemap.xml` and `robots.txt`. **re-run it after editing `js/doctor-data.js` or adding a page.**

after deploying, add the site in [Google Search Console](https://search.google.com/search-console) and submit `sitemap.xml`. the site lives in a subfolder of github.io, so robots.txt there isn't read by crawlers — submitting the sitemap is what counts.

## shipping changes

- the commit hook runs `node scripts/validate-guides.mjs` to check the guides and knowledge-map links
- the service worker precaches everything under a versioned cache name — bump the `CACHE` constant in `sw.js` when you ship a big content change so installed visitors pick it up

## who made it

me, Jose Laurencio — FTC team captain, INSPIRE award national winner, and FTC Leadership Award winner. i run the RoboCodex channel on [YouTube](https://www.youtube.com/@RoboCodex) and [Instagram](https://www.instagram.com/robocodexyt). this site is the companion to the channel: everything i teach in videos, written down for people who'd rather read.

## get in touch

questions, ideas, or spot something wrong? reach me at [robocode98@gmail.com](mailto:robocode98@gmail.com).

made for the FTC community. if this saved your rookie season, go help the next team.
