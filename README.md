# Vincent Cheng: portfolio (Apple-style)

A personal portfolio styled as a parody of Apple's iPhone product pages: a hero video, a
highlights carousel you scroll through, and dark product-style sections for AMD, SignBridge
and ScopeChat.

Plain HTML, CSS and JavaScript. No framework, no build step, so it runs on GitHub Pages as-is.

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Editing content

All text is written directly in [`index.html`](index.html), section by section.

**Swapping in media:**

| What | Where |
| --- | --- |
| Hero video | Save it as `assets/video/signbridge-hero.mp4` (H.264 MP4, no audio needed, a 10–20 s loop, ideally under 10 MB). It replaces the still automatically. If the framing is off, change `--hero-focus` at the top of `css/style.css`. |
| Hero still | `poster=` on the `<video>` in `index.html` (currently `signbridge-hero-poster.jpg`) |
| Highlight cards | the `<li class="gcard">` items under "Get the highlights". Add or remove cards freely; the scroll length adapts. |
| Camera viewfinder | the `<img>` inside `.vf-view` (4:3 works best) |
| Processor / amplifier | replace each `<div class="card-art">` placeholder drawing with an `<img>` |

Keep images around 1600 px on the long edge. iPhone HEIC photos need converting to JPG first.

**Font:** the page asks for Apple's system font first, so Macs and iPhones render the real SF Pro.
SF Pro's licence doesn't allow hosting it on a website, so other devices fall back to Inter,
the closest free match.

**Motion:** the hero shrink, word-by-word intro, pinned highlights and fade-ins all switch off
for visitors who have reduced motion turned on; the highlights then become a swipeable row.

## Deploying to GitHub Pages

Push this folder to a repository, then in **Settings → Pages** set **Source** to *Deploy from a
branch* and pick `main` / `/ (root)`. All paths are relative, so it works at a user site
(`vincentbot88.github.io`) or a project site (`vincentbot88.github.io/<repo>/`).

## Structure

```
index.html        all page content
css/style.css     layout, type, sections, responsive rules
js/main.js        scroll effects, highlights carousel, eye diagrams, ScopeChat demo
assets/           images, favicon, resume PDF (add video/ for the hero clip)
```
