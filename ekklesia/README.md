# Ekklesia 2027

Static site for New Life Christian Church's Ekklesia 2027 gathering (17–26
February, Warrnambool VIC). Built on the same architecture as the other
mahda.com.au subfolder sites: a hash router, a same-origin JSON content
file, and a six-way livery switcher.

## Structure

```
ekklesia/
  index.html              shell: header, nav mount, #app mount, footer, script tags
  pages.json               all page copy — edit this to change content
  assets/
    css/liveries.css       six colour themes as CSS variables
    css/main.css           layout, type, components
    js/router.js           generic #/id hash router
    js/app.js              fetches pages.json, renders routes, livery switcher
    img/newlife-logo.png   cropped from the event flyer
    img/ftlog-logo.png     "For the Love of God — Down Under" logo, cropped from the flyer
    img/favicon.svg
```

## Editing content

Everything text-based lives in `pages.json` — site info, nav, and the five
pages (`home`, `program`, `stay`, `visit`, `contact`). No HTML/JS editing
needed for routine updates (dates, speaker names once confirmed, accommodation
details, etc). If `pages.json` fails to load (e.g. opened straight from disk
via `file://`), `app.js` falls back to an embedded copy of the same data —
if you edit `pages.json`, keep that in mind if testing locally without a
server; run a quick local server instead (`python3 -m http.server`) so the
fetch actually succeeds and you're editing the live copy, not the fallback.

## Liveries

Six themes, matching the mahda.com.au system: **Iron** (default — steel
night, fireworks gold), Brass, Vellum, Emerald, Sanctum, Sigil. Switched via
the dots in the header, persisted to `localStorage`. To change the shipped
default, edit `data-livery="iron"` on the `<html>` tag in `index.html` and
the fallback in `applyLivery(saved || "iron")` in `app.js`.

## Deploying

Drop the whole `ekklesia/` folder as a subfolder deployment, same as the
other sites — e.g. `mahda.com.au/ekklesia/`. No build step; it's plain
HTML/CSS/JS. Fonts (Cinzel, IM Fell English, UnifrakturMaguntia) load from
Google Fonts at runtime, so the deployed site needs normal internet access
for visitors — nothing to bundle.

## Known gaps / TBC

The flyer doesn't specify which of the ten days are the three Encounter
days, or name any guest speakers — copy is written honestly around that
(see `pages.json` → `pages.program`). Update once the full schedule is
locked in.
