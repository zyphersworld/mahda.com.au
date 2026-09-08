# Living Tree — GH Pages `/living-tree/`

**Christopher GO** for this push.

**Target:** `https://mahda.com.au/living-tree/` via GitHub Pages on `zyphersworld/mahda.com.au`  
**Bundle:** `/workspace/genealogy/ship/living-tree-public/`  
**Version note:** `0.11.5-panel-v2+`  
**Soft≠solid** · streets/sealed scrubbed · living **default-redacted**, unlock with passphrase (bluey) client-side  
**Exported:** 2026-09-08T07:17:40Z (UTC)

## Contents
| File | Role |
|---|---|
| `index.html` | Living Tree Irish oak UI (`<base href="/living-tree/">`) + Unlock living |
| `graph.json` / `graph.public.json` | Default snapshot — living names redacted |
| `graph-living.json` / `graph.living.json` | Loaded after passphrase unlock (streets/sealed still scrubbed) |
| `kinship-energy.json` | KE energy packs (`kinship_energy.json` alias) |
| `kinship-index.json` | KE index companion |
| `kinship-predicates.json` | KE predicates companion |
| `.nojekyll` | Allow underscored paths on GH Pages |

Offline: `fetch('./graph.json')` · unlock → `./graph-living.json` · energy → `./kinship-energy.json`.  
CDN: Three.js 0.160 from unpkg (no FastAPI).

## Counts
| Metric | N |
|---|---|
| People | 583 |
| Edges | 1037 |
| Supported (solid) | 43 |
| Soft open | 7 |
| Living (redacted by default) | 225 |
| Living names hidden (default) | 225 |

## Deploy
```bash
# from a checkout of zyphersworld/mahda.com.au
rsync -a --delete /workspace/genealogy/ship/living-tree-public/ ./living-tree/
git add living-tree && git commit -m "Christopher GO: Living Tree public snapshot 0.11.5-panel-v2+" && git push
```

## Rules
- Soft≠solid labels kept
- No invent joins
- Streets / sealed locality strings scrubbed on both graphs
- No FastAPI on the public site
- `/family` pack untouched by this export

Regenerate: `python3 /workspace/genealogy/explorer/build_living_tree_public.py`
