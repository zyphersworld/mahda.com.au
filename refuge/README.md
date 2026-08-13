# A Permanent Place of Refuge — site folder

Drop this whole `refuge/` folder into the web root so it serves at
`mahda.com.au/refuge/`. No build step, no dependencies, all links relative.

## Files

    refuge/
      index.html                 shell only — no copy lives here
      404.html
      pages.json                 ALL editable copy
      assets/css/liveries.css    six-livery tokens (vellum default)
      assets/css/site.css        layout, corner-bracket panels, print rules
      assets/js/app.js           hash router + livery switcher + baked fallback
      docs/                      downloadable proposal

## Editing

Change `pages.json` only. Add, remove or reorder entries in `pages` and the
nav rebuilds itself — one definition drives the plaques, the router and the
document title. Each entry needs `id`, `nav`, `title`, `kicker`, `body`
(body is an HTML string).

The `meta` block drives the masthead and the docket strip at the top:
`status`, `version` and `updated` are what a reader checks first, so keep
`updated` current.

## The baked fallback

`app.js` contains a copy of `pages.json`, injected at build time, so the page
still renders when opened directly from disk with no server — useful for
showing it on a laptop with no connection. **If you edit `pages.json` this
copy goes stale.** That only affects `file://` preview; over http the JSON
always wins. To refresh it, re-inject the JSON between the
`/*__FALLBACK__*/` markers, or just ignore it.

## Liveries

Vellum is the default here rather than Iron. This page gets printed and read
by council officers and MPs, and vellum is the one that survives a black and
white printer. The other five are one click away and the choice persists in
localStorage.

## Print

There is a real print stylesheet. Printing drops the docket strip, nav,
livery switcher and buttons, flattens the panels, forces black on white and
appends link URLs after external links. Print the page you want — the router
renders one section at a time, which is deliberate.

## Deliberately not included

- No analytics, no tracking, no third-party scripts beyond Google Fonts.
- `noindex, nofollow` is set in `index.html`. **Remove that line only after
  the proposal is cleared to go public.** Until then the folder can sit live
  without being found.
