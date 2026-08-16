# The Waiting List — site folder

Drop this whole `reckoning/` folder into the web root so it serves at
`mahda.com.au/reckoning/`. No build step, no dependencies, all links relative.
Same engine as the medical and refuge sites: `pages.json` drives content, a
hash router handles navigation, six liveries via CSS variables (Iron is the
default here — this page is meant to read as a hard, factual ledger, not a
polished pitch).

## Files

    reckoning/
      index.html                 shell only — no copy lives here
      404.html
      pages.json                 ALL editable copy
      assets/css/liveries.css    six-livery tokens (Iron default)
      assets/css/site.css        layout, corner-bracket panels, print rules
      assets/js/app.js           hash router + livery switcher + baked fallback

## Editing

Change `pages.json` only. Update the `meta.updated` date every time you touch
it — this page's whole credibility rests on being visibly current, since it's
built to be handed to journalists, MP offices, and potentially the Ombudsman.

## Analytics

Google Analytics (GA4) is wired in but inactive — both `index.html` and
`404.html` have a placeholder ID (`G-XXXXXXXXXX`) that needs replacing before
it does anything:

1. Create a free GA4 property at analytics.google.com (needs a Google login)
2. Copy the Measurement ID it gives you (looks like `G-ABC1234XYZ`)
3. Find-and-replace `G-XXXXXXXXXX` with that ID in both HTML files —
   two occurrences in each file

This is a single-page app (the hash router never triggers a real page
reload), so basic GA4 would only ever record one visit total, never which
sections people actually read. `assets/js/app.js` fires a virtual pageview
on every section change to work around that — nothing to configure, it
just works once the ID above is in place.

Worth knowing: this page's likely readers include DFFH staff, an Ombudsman
investigator, and journalists — people who sometimes notice and mind being
tracked more than an average visitor. Not a reason not to run analytics,
just worth being aware of.

## Keeping the reach numbers honest

The Reach page states figures as read directly off the platform's own
analytics, not independently audited. Keep that framing — don't round up,
don't drop the caveat. A tracker that oversells its own numbers is worse
than no tracker.

## The unverified figures

Two numbers on the Pattern page (60,000 statewide waitlist, six-week hotel
funding cap) are sourced from other commenters' own reported experience, not
a document. They're flagged as such on the page. Verify them properly (a
DFFH/Homes Victoria annual report, or a direct query to the department)
before this page is shown to press or officialdom, or drop them if they
can't be confirmed.

## Liveries

Iron is the default deliberately — this is a ledger, not a proposal. The
other five liveries are one click away and persist via localStorage.

## Deliberately kept minimal

No tracking beyond Google Fonts and the GA4 setup described above (inactive
until you add your Measurement ID). No third-party scripts beyond those two.
