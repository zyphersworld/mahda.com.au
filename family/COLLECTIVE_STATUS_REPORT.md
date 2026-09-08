# Collective status — /family Greene–Hoy tree

Date: 2026-09-08  
Site: https://mahda.com.au/family  
Repo path: `family/` on `zyphersworld/mahda.com.au`

## Corrections applied (Christopher)

- **Andrea Moon / `greene-andrea` deleted.** Invented by inferring a spouse from the compound surname Greene-Moon. Never invent spouses or children from name compounds.
- Memoir-inferred wives are not tree nodes unless Christopher named them in a real GR export.
- Soft≠solid does **not** license fabricating living household people.
- Tripod/hoykin notes stay in `sources/` as **text only**. They are not imported as people.

## What shipped

| Item | State |
|---|---|
| Three.js explorer (`three@0.160` + OrbitControls) | In `family/assets/js/app.js` |
| Orbit / zoom / pan / click-select | Yes |
| Soft≠solid colour legend + filters + search | Yes |
| Living unlock passphrase `bluey` (SHA-256 + sessionStorage) | Yes |
| Real GR 583-person export | **Not on this VM** |
| `graph.json` / `graph-living.json` | Honest **empty** arrays + `placeholder: true` |
| Invented Hoy/Greene living nodes | **None** |

## How to load the real tree

Drop the GR export as `family/graph-living.json` (schema: `people[]`, `edges[]`, `living_redacted` / `living_visible`). Run `node family/scripts/redact.mjs` to refresh the public graph. Do not scrape names into the JSON.

## Out of scope (still)

Koroit streets, NDIS dollar amounts, SMS payloads, sealed housing — never in this tree.
