# Collective status — Greene–Hoy public tree

Updated 8 September 2026.

## What shipped

A static pack at `family/` for GitHub Pages. After merge it is meant to live at https://mahda.com.au/family.

| File | Role |
| --- | --- |
| `index.html` | Shell, unlock form, tree / index / sources |
| `graph.json` / `graph.public.json` | Default graph — living names are `Living` |
| `graph-living.json` | Same graph with living names (session unlock) |
| `assets/` | Liveries, layout, canvas tree, favicon |
| `scripts/build-graph.py` | Rebuild from held sources |
| `scripts/redact.mjs` | Public graphs from the living graph |
| `scripts/from-gedcom.mjs` | Import a GEDCOM, then redact |
| `.nojekyll` | Pages: do not run Jekyll on this folder |

Counts in this revision: **295 people**, **85 living**, **210 deceased**, **13 solid**, **282 soft**, **104 unions**.

## Living unlock

Passphrase `bluey`. Stored in `sessionStorage` as `family.livingUnlocked`. Without it, every living display name is `Living`. Relocking reloads the public graph.

Static-host limit: `graph-living.json` is still a public file. The passphrase is a session courtesy, not access control.

## Soft ≠ solid

Solid people are only those named on the two VIC historical death-register pages purchased 4 September 2026 (Yangery / Southern Cross, Jane Green 1909 entry 186 and Michael Green 1912 entry 198). Everyone else is soft. The canvas draws solid strokes for solid edges and dashed strokes for soft and step links.

## What was refused

- Invented people, invented register numbers, invented generations between Yangery 1912 and the living household.
- Assuming Elizabeth's maiden name is Hoy.
- Assuming Francis Patrick Greene (1899–1970) is Michael and Jane's grandson.
- Koroit street addresses, NDIS dollar figures, SMS bodies, sealed housing notes.
- Other families that merely share the same register page (McCullough, Elliott, McInor, Gleeson).

## Gaps

- No GEDCOM / Ancestry / FamilySearch export was in the repo or Drive, so the pack is not ~583 people. Drop an export on `from-gedcom.mjs` to grow it.
- The memoir PDF's "DAD'S FAMILY TREE" panel is an image and was not transcribed.
- Hoy kin come from a compiled public report, not from certificates in this folder.
- The two Yangery issue columns disagree (Bridget / Nora / James vs Michael / Maria). Disputed children stay soft.

## Pages

Site already publishes from `main` at the repository root with `CNAME` mahda.com.au. No Jekyll. After merge, `/family/` should just work. If it 404s, confirm Pages is **branch `main` / root**.
