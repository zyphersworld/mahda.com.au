# Install — subfolder layout (for mahda.com.au)

Unzip into the ROOT of your existing repo. It only adds `.github/` and
`reckoning-desk/` and overwrites nothing of yours.

```
<repo root>/
├── (your existing site files — untouched)
├── .github/workflows/feed.yml         ← must be at root; GitHub only runs workflows here
└── reckoning-desk/
    ├── index.html                     ← the page
    ├── posts.json                     ← "Things You Need to Know" entries (edit to add posts)
    ├── headlines.json                 ← auto-updated news feed
    └── scripts/build-feed.mjs
```

Live at: https://mahda.com.au/reckoning-desk/

## Setup
1. Unzip into your repo root (enable "show hidden files" so `.github` is included).
2. Commit and push to `main`.
3. Settings → Actions → General → Workflow permissions → **Read and write**.
4. Actions tab → Build news feed → Run workflow (first run; then every 30 min).

## Adding a "Things You Need to Know" post
Edit `reckoning-desk/posts.json`. Add an object to the top of the `posts` array:
```json
{
  "id": "2026-09-21-hearing",
  "date": "2026-09-21",
  "dateLabel": "As of 21 September 2026",
  "title": "Your headline",
  "know": ["Bullet one.", "Bullet two."],
  "body": ["A paragraph.", "Another paragraph."],
  "byline": "— Kept by a survivor"
}
```
Also bump the top-level `"updated"` date. The page sorts newest-first by `date`.
