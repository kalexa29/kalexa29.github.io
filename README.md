# katelynnalexander.com

## Files
- `index.html`, `styles.css`, `script.js`: structure, design, rendering.
- `content.json`: all site text lives here. Edit this for any copy change.
- `validate-content.js`: run `node validate-content.js` before pushing to catch mistakes in `content.json`.
- `CNAME`, `robots.txt`, `sitemap.xml`, `llms.txt`: hosting/SEO/AI-crawler config.

## Keep in sync
The three services live in three places: `content.json` (renders the page), `llms.txt` (AI-readable summary), and the `Service`/`FAQPage` JSON-LD in `index.html`'s `<head>` (static, for crawlers). Edit a service, update all three.

## Preview locally
```
python3 -m http.server 8000
```
Then open `http://localhost:8000`. Double-clicking `index.html` won't work, it needs a server to fetch `content.json`.

## Testing
`node validate-content.js` checks `content.json` for missing or malformed fields before you deploy. On the live page, each section (hero, services, skills, education, contact) renders independently, so one bad field only blanks that section (logged to the browser console) instead of the whole page.
