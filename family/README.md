# Public family tree — GH Pages `/family/`

**Target:** `https://mahda.com.au/family/` via GitHub Pages on `zyphersworld/mahda.com.au`  
**Bundle:** `/workspace/genealogy/ship/family-public/`  
**Soft≠solid** · streets/sealed scrubbed · living **default-redacted**, unlock with passphrase (same as :8793) in the browser

## Contents
| File | Role |
|---|---|
| `index.html` | Static Three.js tree UI (`<base href="/family/">`) + Unlock living control |
| `graph.public.json` | Default snapshot — living names redacted |
| `graph.living.json` | Loaded after passphrase unlock (streets/sealed still scrubbed) |
| `graph.json` / `graph-living.json` | Aliases of the two above |
| `COLLECTIVE_STATUS_REPORT.md` | Downloadable public-safe status report |
| `.nojekyll` | Allow underscored paths on GH Pages |

CDN: Three.js 0.160 from unpkg (no FastAPI).

## Regenerate (on box, with :8793 up)
```bash
python3 /workspace/genealogy/explorer/build_family_public.py
```
This refreshes both graph files (+ aliases) and `COLLECTIVE_STATUS_REPORT.md`. It does **not** overwrite `index.html` if present.

## Deploy to GitHub Pages
Copy the contents of `family-public/` into the site repo under `family/` (so URLs are `/family/`, `/family/graph.public.json`, …), then push.

Example:
```bash
# from a checkout of zyphersworld/mahda.com.au
rsync -a --delete /workspace/genealogy/ship/family-public/ ./family/
git add family && git commit -m "Update public family tree snapshot" && git push
```

## Unlock note
Passphrase unlock is **client-side** on a static host: after a correct passphrase, the page loads `graph.living.json` and stores unlock in `sessionStorage`. Knowing the file URL still bypasses the gate — same threat model as :8793 `?unlock=…`. Streets and sealed locality strings are scrubbed even when unlocked. No unlock → living stays redacted.

## Rules
- Soft≠solid labels kept
- No invent joins
- No Koroit / Penshurst / Hobbs / NDIS $ / street lines in public payloads
- No FastAPI on the public site

Exported from GR tree version at build time (see report header).
