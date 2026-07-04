CROSSROADS INTERNATIONAL BIBLE COLLEGE — student website
=========================================================

A static rebuild of the Crossroads student site. No build step, no
dependencies to install — plain HTML/CSS/JS. Just upload the files.

WHAT CHANGED IN THIS VERSION
----------------------------
  - Navigation reorganised into 6 clear groups (About, Courses,
    Booklets, Curriculum, Resources, Contact) instead of 20 flat
    top-level items. The desktop bar is now a single tidy row.
  - Mobile hamburger menu rebuilt: it now opens reliably and shows
    every group with its sub-links expanded inline, with an animated
    open/close icon.
  - Consolidated near-duplicate pages to cut the site's size from 32
    to 23 pages:
      * The three Series "Contents" pages folded into the Series pages.
      * "Booklets by Category" (two near-identical pages) merged to one.
      * Module Course + Curriculum kept as one Curriculum hub.
      * Progressive Release folded into the 75+ Booklets page.
      * Extra-on-Benchmark + Where-Crossroads-Sits folded into the
        Curriculum Benchmark page.
      * Video Promo + Poster Promo folded into Resources.
  - Old page addresses still work: the 9 removed URLs are kept as
    lightweight redirect stubs that forward to the merged page, so any
    existing bookmarks or shared links won't break.
  - Dark theme (Oxford) default; Algerian headings; compact layout.

WHAT'S INSIDE
-------------
  index.html ............... About Us / home (landing page)
  student-sign-up.html ..... Student Sign-Up (main enrolment page)
  our-beliefs.html ......... Statement of Beliefs
  + 28 further pages mirroring the original site structure
  404.html ................. fallback page
  assets/crossroads.css .... shared stylesheet (all styling + themes)
  assets/crossroads.js ..... shared shell (nav, footer, theme switch)

The header nav and footer are generated on every page from a single
list inside assets/crossroads.js. To add, rename, or reorder a page,
edit the NAV array at the top of that file once — every page updates.

THEMES
------
Three themes in the header switcher: Oxford (dark, default), Chapel
(dark violet), Parchment (light). The choice is remembered per browser.

FONTS
-----
Algerian is a Windows system font; visitors who have it installed see
the real face. Everyone else gets Rye from Google Fonts, which matches
Algerian's engraved western-tuscan capitals closely. No action needed.

MOBILE HEADER
-------------
The header now scales cleanly on phones: the brand title wraps instead
of overflowing, the theme swatches and button stay clear of it, the
"Sign Up / Log In" button shortens to "Sign Up", the kicker line hides
on narrow screens, and the crest hides below 340px. No horizontal
scroll at any width.

BACK LINK
--------
The Expanded Descriptions page has a single floating "Back" button
(bottom-left) that stays visible as you scroll, so you can return
without scrolling to the top. It returns you to wherever you arrived
from (All Booklets index, 75+ Booklets hub, etc.) using browser
history so your scroll position is kept; if opened directly it falls
back to the All Booklets index.

BOOKLET ANCHOR LINKS
--------------------
On the "All Booklets" index, each title links straight to that
booklet's description on the Expanded Descriptions page (e.g.
expanded-75-booklets.html#fasting). The target scrolls clear of the
sticky nav and briefly highlights. Deep-links to a specific booklet
work too.

DEPLOYING
---------
Upload the whole folder (keep the assets/ subfolder intact).
index.html is the entry point. Drops into a /crossroads/ subfolder on
mahda.com.au with no path changes — all links are relative.

NOTES
-----
- The sign-up / application / contact forms are front-end only. Point
  them at a form handler (Formspree, Netlify Forms, a Google Form, or
  the College's own endpoint) when ready.
- Real content: all 70 booklet titles + descriptions, the full
  booklet contents listings, and the complete module curriculum
  (Series 1-3 with real S#-#-# unit codes) are taken directly from
  the live site and shown openly. Only the booklet PDFs and graded
  assessments themselves carry a small "sign in" tag, as those files
  require a login.
- External assets (promo videos, audio review, prospectus flipbook)
  still point at their original hosted URLs.
