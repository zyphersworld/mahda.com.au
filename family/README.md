# Greene–Hoy family tree

Static public tree for **https://mahda.com.au/family**. Plain HTML/CSS/JS, same livery system as the rest of mahda.com.au. No build step on deploy.

## Living unlock

- Default graph (`graph.json` / `graph.public.json`) redacts every living person to the name **Living**.
- Passphrase **`bluey`** loads `graph-living.json` for this browser session (`sessionStorage`).
- Lock again to return to the redacted graph.
- This is a courtesy gate on a static host. Anyone who fetches `graph-living.json` directly can read living names. Do not put streets, NDIS figures, SMS bodies, or sealed housing notes in the living file.

## Soft ≠ solid

| Mark | Meaning in this pack |
| --- | --- |
| **Solid** | Named on a Victorian historical death-register page we actually hold (Yangery / Southern Cross, 1909 and 1912). |
| **Soft** | Family memoir, or the public compiled Augustine Hoy descendant report. Not a certificate in this folder. |

Dashed strokes are soft (or step). Solid strokes are solid. The two are not the same, and the page says so.

## What is in the graph

Three **unjoined** components. No invented people, and no invented register numbers.

1. **Contemporary Greene** (soft) — household named in Ethan Greene's memoir *Biography Christopher Peter Greene*.
2. **Yangery Green, 1909–1912** (solid) — Michael Green (d. 1912) and Jane Green (d. 1909), their parents as stated on those registers, and the children named in the issue columns. The two issue lists disagree; names that appear on only one page stay **soft**.
3. **Hoy kin** (soft) — parsed from the public compiled report [Descendants of Augustine HOY](https://hoykin.tripod.com/id101.html), including Ellen Hoy × Francis Patrick Greene (1926). People without a death date who could still be living are marked living and redacted.

The memoir does not prove that Elizabeth's maiden name is Hoy. The registers do not prove that Francis Patrick Greene (1899–1970) is a grandson of Michael and Jane. Those links are **not drawn**.

This pack is hundreds of people, not ~583. The 583-scale tree needs a GEDCOM or Ancestry/FamilySearch export dropped in and regenerated.

## Regenerate

From the repo root:

```bash
# Rebuild the current sources (Hoy extract + BDM cluster + memoir household)
python3 family/scripts/build-graph.py

# Or replace the living graph from a GEDCOM, then redact
node family/scripts/from-gedcom.mjs path/to/export.ged

# If you edited graph-living.json by hand
node family/scripts/redact.mjs
```

`from-gedcom.mjs` strips street-like strings, `$` amounts, and NDIS snippets from notes. It marks every imported fact **soft** unless a GEDCOM note contains the word `SOLID`.

To add a new solid person: put them in `scripts/build-graph.py` (`add_bdm_green`) with a real source sentence, or tag a GEDCOM note `SOLID` only when you hold the register.

The Hoy extract used by the builder lives at `sources/hoykin-augustine-hoy.txt`. Replace that file if the compiled report is updated.

## GitHub Pages

This site is already a user Pages site from the repository root (`CNAME` → mahda.com.au). There is no Jekyll config. After this folder is on `main`:

- `https://mahda.com.au/family` and `https://mahda.com.au/family/` both serve `family/index.html`.
- Asset URLs are relative (`graph.json`, `assets/...`) so they resolve under `/family/`.
- `family/.nojekyll` is present in case a future `_` file is added.

One-time check if `/family` 404s after merge: **Settings → Pages → Build and deployment** should be **Deploy from a branch**, source **`main` / `/ (root)`**. No extra Action is required. Custom domain is already `mahda.com.au`.

Do not add a homepage plaque unless you want the tree linked from the landing nav. This pack only adds `family/`.

## Local preview

```bash
python3 -m http.server 8080
# open http://127.0.0.1:8080/family/
```

Opening `index.html` as `file://` will not fetch the JSON.
