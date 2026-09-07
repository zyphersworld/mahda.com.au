# The Waiting List — site folder

Drop this whole `waiting-list/` folder into the web root so it serves at
`mahda.com.au/waiting-list/`. No build step, no dependencies, all links relative.
Same engine as the medical and refuge sites: `pages.json` drives content, a
hash router handles navigation, six liveries via CSS variables (Iron is the
default here — this page is meant to read as a hard, factual ledger, not a
polished pitch).

## Files

    waiting-list/
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

Google Tag Manager is installed and live — container `GTM-NL6F28VS`, the
same one used on the Christian Brothers insolvency site. Both `index.html`
and `404.html` have the standard two-part GTM snippet: the script in
`<head>` and the `<noscript>` iframe immediately after `<body>`.

Because this is a single-page app (the hash router never triggers a real
page reload), a bare GTM install only ever sees one page view per visit.
`assets/js/app.js` pushes a `virtual_page_view` event to `dataLayer` on
every section change to work around that.

**One thing this code can't do on its own:** that dataLayer push means
nothing in GA4 until a matching trigger exists inside the GTM container
itself — a Custom Event trigger listening for `virtual_page_view`, wired to
fire a GA4 Page View or Event tag. That's a one-time setup inside
tagmanager.google.com, not something in this codebase. If it's already
configured for the other site sharing this container, section views here
should start showing up the same way. If not, that's the one manual step
left.

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
