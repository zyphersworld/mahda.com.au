# The Reckoning Desk — setup

A survivor-kept monitoring page for the Christian Brothers (Oceania Province) insolvency.
The news feed is built server-side by a GitHub Action and committed as `headlines.json`,
so the page only ever fetches a file from its own origin — no CORS, no third-party proxy,
no flaky relays.

## Files

| File | Where it goes in the repo | What it does |
|------|---------------------------|--------------|
| `christian-brothers-watch.html` | repo root (rename to `index.html` if you want it at the site root) | the page |
| `headlines.json` | repo root, **next to the HTML** | the feed the page loads; auto-updated |
| `feed.yml` | `.github/workflows/feed.yml` | the scheduled Action |
| `build-feed.mjs` | `scripts/build-feed.mjs` | the fetch-and-parse script the Action runs |

> The HTML and `headlines.json` must sit in the **same folder** so the relative
> fetch (`headlines.json`) resolves. If you put the page in `/docs`, put the JSON there too,
> and change the commit path in `feed.yml` (`git add docs/headlines.json`) and the
> output path in `build-feed.mjs` (`writeFile('docs/headlines.json', ...)`).

## One-time setup

1. Create the repo and add the files in the layout above.
2. **Settings → Pages**: set the source to your branch (`main`) and folder (`/root` or `/docs`).
3. **Settings → Actions → General → Workflow permissions**: choose
   **Read and write permissions** (the Action commits the updated JSON back).
4. Push. The Action runs on push and then every 30 minutes; you can also trigger it
   by hand from the **Actions** tab → *Build news feed* → *Run workflow*.

## Tuning

- **How often it refreshes:** the `cron` line in `feed.yml`. Every 30 min is generous;
  GitHub may throttle very frequent schedules, and free Action minutes are finite, so
  hourly (`0 * * * *`) is a fine, lighter choice.
- **What it searches:** the `QUERY` constant at the top of `build-feed.mjs`.
- **How many headlines:** `MAX_ITEMS` in `build-feed.mjs` (the page shows up to 8).

## How it fails safely

- If a fetch or parse fails, `build-feed.mjs` exits non-zero **without** overwriting the
  file, so the last good `headlines.json` stays put.
- If the page can't load `headlines.json` at all (e.g. first load before the file exists),
  it shows a small curated list baked into the HTML so the panel is never empty.

Note: Google News RSS is a pragmatic single source. If you later want multiple named
outlets, add their RSS URLs to an array in `build-feed.mjs`, fetch each, and merge —
the page side needs no changes.
