# robocodex-website

hey, this is the repo for the robocodex site. it's a resource for people going from FLL to FTC, because that jump is way harder than anyone tells you and i got tired of watching rookie teams figure it out the painful way.

built with plain html, css, and js. no react, no build step, no npm install before you can see a button. you open a file, you edit it, you refresh. hosted free on github pages.

made by jose — 16, FTC team captain, INSPIRE award national winner, FTC Leadership Award Winner.

## what's in here

| page | file | what it does |
|---|---|---|
| home | `index.html` | hero, why this exists, featured videos, course teaser |
| content | `content.html` | the video library, filterable by topic, loads from `videos.json` |
| about | `about.html` | my story, awards, what's next |
| course | `course.html` | the FTC transition course (coming soon) + faq accordion |
| contact | `contact.html` | contact form, goes through formspree |

other stuff that works: sticky nav with a hamburger menu on mobile, smooth scrolling, back-to-top button, responsive down to small phones.

## file structure

```
robocodex.github.io/
├── index.html
├── content.html
├── about.html
├── course.html
├── contact.html
├── css/
│   └── style.css        ← all the styling, one file
├── js/
│   └── script.js        ← all the js, one file
├── data/
│   └── videos.json      ← video list lives here
├── scripts/
│   └── update-videos.mjs ← pulls videos from youtube
├── images/
└── README.md
```

## running it locally

clone it:

```bash
git clone https://github.com/your-username/robocodex.github.io.git
cd robocodex.github.io
```

now **don't** just double-click `index.html`. it'll mostly work, but the video library will be empty and you'll spend 20 minutes confused. that's because `fetch()` can't read `videos.json` off a `file://` url — browsers block it (CORS). ask me how i know.

run a tiny local server instead:

```bash
python3 -m http.server 8000
```

then go to `http://localhost:8000`. or use the Live Server extension in VS Code if you'd rather click a button.

## deploying to github pages

1. make a **public** repo. name it `your-username.github.io` if you want it at the root domain, or any name if you're fine with `username.github.io/repo-name/`.
2. push:

```bash
git init
git add .
git commit -m "initial robocodex commit"
git branch -M main
git remote add origin https://github.com/your-username/robocodex.github.io.git
git push -u origin main
```

3. on github: **settings → pages**. source = `deploy from a branch`, branch = `main`, folder = `/ (root)`. save.
4. wait like 2-5 min. it does not go live instantly and it's not broken, it's just slow.

**gotcha:** if you deployed to a project repo (not `username.github.io`), every path like `/css/style.css` will 404 because the site actually lives at `/repo-name/`. use relative paths (`css/style.css`, no leading slash) and you're fine.

## updating the videos

the content page reads from [`data/videos.json`](data/videos.json). two ways to update it.

**automatic (easier):**

```bash
node scripts/update-videos.mjs
```

it pulls from the robocodex youtube feed by default. to point it at a different channel, set one of these first:

```bash
YOUTUBE_CHANNEL_ID=UCxxxxxxxx node scripts/update-videos.mjs
# or YOUTUBE_USERNAME, or YOUTUBE_HANDLE
```

**by hand:** open `data/videos.json` and add an object:

```json
{
  "id": "7",
  "title": "how to actually build a linear slide",
  "youtubeId": "dQw4w9WgXcQ",
  "date": "2025-03-14",
  "category": "FTC Basics",
  "description": "one paragraph, keep it short"
}
```

- `youtubeId` is just the part after `?v=` in the url. not the whole url.
- `date` has to be `YYYY-MM-DD` or the sorting gets weird.
- if you invent a new `category`, go add a matching filter button in `content.html` or nobody will ever see those videos.
- json doesn't allow trailing commas. if the library page goes blank, that's the first thing to check — open the console and it'll tell you.

## hooking up the contact form

form submissions go through formspree so there's no backend to run.

1. make a free account at [formspree.io](https://formspree.io/)
2. create a form, copy the endpoint it gives you (looks like `https://formspree.io/f/xxxxxxxx`)
3. in `contact.html`, swap the placeholder:

```html
<form action="https://formspree.io/f/YOUR_FORMSPREE_ID" method="POST" id="contactForm" class="contact-form">
```

4. submit a real test message from the live site. the free tier caps out at 50 submissions/month, and the *first* submission needs you to confirm it by email before anything else comes through.

## google analytics (optional)

if you want traffic numbers, make a GA4 property, grab the measurement id (`G-XXXXXXXXXX`), and paste this right before `</head>` in **every** html file. missing one page is the classic mistake:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

your own visits will show up too, so don't get excited about 4 pageviews.

## changing colors and fonts

everything's a css variable at the top of `css/style.css`. change it in one place, it changes everywhere:

```css
:root {
  --primary-color: ...;
  --secondary-color: ...;
  --accent-color: ...;
  --dark-text: ...;
  --light-background: ...;
  --footer-background: ...;
  --heading-font: ...;
  --body-font: ...;
}
```

if you want different google fonts, update the `@import` at the very top of `style.css` **and** the font variables. changing only one does nothing and it's annoying to debug.

after changing colors, run it through a contrast checker. light gray text on white looks clean in your head and is unreadable on an actual phone in a gym.

## images

- compress everything before committing. [tinypng](https://tinypng.com/) takes ten seconds and cuts file size like 70%.
- webp is smaller than jpg if you can convert.
- images already have `loading="lazy"` so offscreen ones don't block the page.
- `images/` still has placeholders (`hero-bg.jpg`, `jose-photo.jpg`, `robot.jpg`) — replace those with real photos.
- keep the hero image under ~200kb. it's the first thing that loads and people on venue wifi will bounce.

## accessibility + seo

not just a checkbox thing, some of this genuinely matters:

- semantic html (`<header>`, `<nav>`, `<section>`, `<footer>`) instead of divs everywhere
- every image has real `alt` text. "image1" doesn't count, describe what's actually in it
- headings go h1 → h2 → h3 in order, no skipping levels for style reasons
- everything interactive works with tab + enter, no mouse required
- open graph + twitter card meta tags are in there. update `og:image` and `twitter:image` or your links will preview as a blank box

## if something breaks

- **video library is empty** → you opened the file directly instead of running a server, or `videos.json` has a syntax error
- **css didn't load on github pages** → leading-slash paths on a project repo, see the deploy gotcha above
- **form does nothing** → formspree id still says `YOUR_FORMSPREE_ID`, or you never confirmed the first submission
- **changes not showing up** → hard refresh (ctrl+shift+r / cmd+shift+r), github pages caches aggressively

## credits

- built by jose
- icons: [font awesome](https://fontawesome.com/)
- forms: [formspree](https://formspree.io/)
- hosting: [github pages](https://pages.github.com/)

---

made for the FTC community. if this saved your rookie season, go help the next team.
