# The Waiting List — site folder (v2, dashboard front door)

Two layers now, deliberately:

    waiting-list/
      index.html          NEW — condensed dashboard, single self-contained file
      full/                the previous multi-page site, unchanged, moved here
        index.html
        pages.json
        assets/...

## The dashboard (index.html)

Modelled on The Reckoning Desk's engine (mahda.com.au/reckoning-desk/): one
self-contained HTML file, no build step, no separate CSS/JS files. Paper
palette with a light/dark toggle (follows system preference on load), a
live counter since the Ombudsman complaint was lodged, and six widgets —
Where It Stands, Documented Cases, The Ledger, The Voices, Things You Need
to Know, Where to Turn.

This is the front door now. It's meant to be read in under two minutes.
Everything in it links out to the matching page in `full/` for the
unabridged, evidenced version.

**Editing the dashboard:** unlike `full/`, content isn't in a separate JSON
file — the stages, ledger cells, and entries are plain HTML in `index.html`;
the Voices and Where to Turn lists are JS arrays near the bottom of the
file, same pattern as the Reckoning Desk's `VOICES`/`RES` arrays. Update the
`EPOCH` constant if the counter should track a different event than the
Ombudsman complaint. Update `meta`-equivalent content (the standfirst, the
clockbar label) by hand — there's no meta object, it's inline.

## full/ — the complete record

Unchanged from before: `pages.json` drives everything, hash router, six
liveries (Iron default). See `full/README.md` for that layer's own notes —
analytics setup, the unverified-figures caveat, and the liveries system all
still apply there exactly as written.

## Analytics

Same GTM container (`GTM-NL6F28VS`) and GA4 property (`G-ZGWXJJ83MP`) as
`full/` and the Reckoning Desk — both files carry the standard snippet. The
dashboard is a single static page (no hash router here), so it doesn't need
the `virtual_page_view` workaround `full/` uses.

## Why two layers

The dashboard condenses ten pages into six widgets and a two-minute read —
good for a first-time visitor, an MP's staffer, or a journalist on
deadline. `full/` keeps every page, every row, every piece of evidence
exactly as before, for anyone who wants to check a claim or go deep. Nothing
was deleted; it moved one folder down.
