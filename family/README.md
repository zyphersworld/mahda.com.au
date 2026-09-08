# /family — Greene–Hoy tree

Public static explorer for the Greene–Hoy graph on [mahda.com.au/family](https://mahda.com.au/family).

## What is live

Interactive **Three.js** explorer (`three@0.160` + OrbitControls): orbit drag, wheel zoom, right-drag pan, click a node for detail. Soft≠solid colours: supported (green), open (amber), living (violet), gedcom (steel), trap (crimson).

Living names default to **Living**. Passphrase `bluey` (SHA-256 client check) unlocks the living graph for the session (`sessionStorage`).

## Honest empty graph

This folder does **not** invent people. Until Christopher drops the real GR export (~583 people), `graph.json` / `graph-living.json` ship with **empty** `people` and `edges` arrays.

Do **not**:

- Infer spouses or children from compound surnames (Greene-Moon ≠ a person named Andrea Moon).
- Turn `sources/hoykin-augustine-hoy.txt` into tree nodes. That file is **text notes only**.
- Pad the graph from memoir guesses or Tripod scrapes and present them as fact.

## Schema

```json
{
  "version": 1,
  "living_redacted": true,
  "living_visible": false,
  "people": [{ "id": "", "name": "", "status": "living|deceased|unknown", "aka": [], "verdict": "supported|open|living|gedcom|trap|unknown" }],
  "edges": [{ "from": "", "to": "", "kind": "child|spouse", "verdict": "supported|open|gedcom|unknown" }]
}
```

- `graph.json` — public default (living redacted).
- `graph-living.json` — unlocked living names. Streets / sealed housing never belong here.
- `graph.public.json` — alias of the public graph.

Replace both JSON files with the real export, then `node scripts/redact.mjs` if you only have the living file.

## Soft≠solid

| Verdict | Meaning |
|---|---|
| supported | Named + dated + sourced |
| open | Hypothesis — still shown, labelled open |
| living | Privacy default (name hidden until unlock) |
| gedcom | Import only; not independently checked |
| trap | Confusable / do not merge |

Open is not a licence to invent people.

## Unlock

SHA-256 of `bluey` (no newline):

`46b6312339466d3b206325f6f402e1fae56cd65f117c779e3b9259833ffbcdf0`

The living JSON is still a static file. Unlock is a courtesy gate.

## Paths

All assets are relative (`./graph.json`, `./assets/…`) so the explorer works at `/family/` on GitHub Pages.
