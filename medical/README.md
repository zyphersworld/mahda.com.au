# Medical Handover

A single-purpose page for handing to clinical staff — physical or mental health —
so you don't have to explain the whole history out loud every time.

Built on the same architecture as the other mahda.com.au subfolder sites:
hash router, same-origin `pages.json`, six-livery switcher, no build step.

---

## READ THIS FIRST — privacy

**This page contains personal health information and it will be publicly
readable at whatever URL you deploy it to.** Anyone with the link can read it.
There is no login.

What's already been done:

- `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">`
  in `index.html`, plus a `googlebot` variant. **Do not remove those two lines.**
- `robots.txt` in this folder, disallowing `/medical/`.
- `<meta name="referrer" content="no-referrer">` so the URL doesn't leak into
  the logs of any site you link out to.

What you should decide before deploying:

1. **Don't link to it from the main site nav.** Unlinked plus noindex is the
   practical difference between "private enough" and "findable".
2. **Consider renaming the folder** to something non-guessable —
   `mahda.com.au/mh-7k3q/` rather than `mahda.com.au/medical/`. Obscurity isn't
   security, but it stops casual URL-guessing. If you rename it, update the
   path in `robots.txt` to match.
3. **Decide what actually goes on it.** Everything currently on the page is
   information you'd tell a clinician in the first five minutes anyway. Be more
   careful with: exact medication doses, diagnoses you don't want a future
   employer or the other side of your litigation reading, and anything about
   third parties. The 2019 custodial detail in `pages.json` is included because
   you gave it as part of the medical timeline — remove it if you'd rather it
   wasn't public. It's one line in `pages.json` → `pages.cardiac`.
4. **If you'd rather it wasn't public at all:** put it behind a Cloudflare
   Access rule, or just keep the folder off the server and open `index.html`
   from your phone's local storage — it works offline via the baked-in
   fallback (see below).

---

## Structure

```
medical/
  index.html               shell: masthead, nav mount, #app mount, footer
  pages.json               ALL content — edit this, not the HTML
  robots.txt               keeps crawlers out
  README.md                this file
  docs/                    drop PDFs of your actual records here
  assets/
    css/liveries.css       six themes + the clinical high-contrast override
    css/main.css           layout, type, panels, timeline, tables
    css/print.css          clean printed handover sheet
    js/router.js           generic #/id hash router
    js/app.js              renders pages.json; livery + clinical toggles
    img/favicon.svg
```

---

## Editing content

Everything lives in `pages.json`. No HTML or JS editing needed.

**Anything reading `TO FILL` is a real gap I couldn't fill.** The page renders
those in grey so they're visible rather than pretending to be complete. The
important ones:

- `pages.meds` — **allergies and current medications.** This is the first thing
  clinicians ask for. Easiest accurate source is a printed list from your
  pharmacy, not memory.
- `pages.mental` — formal diagnoses (only what's actually on record, with who
  and when), previous supports, and the risk line. That page is no use to
  anyone if it's polite.
- `pages.team` — GP practice, pharmacy, mental health service, emergency
  contact, your phone number.
- `pages.current` — chest symptoms, and the BP log.

### The blood pressure log

`pages.current` → the `table` block. Add rows in the same shape:

```json
["11 Aug 2026", "07:20", "168/104", "78", "before medication"]
```

Anything at or above 180 systolic or 120 diastolic auto-flags in red. No code
change needed — the check is in `app.js` → `isFlagged()`.

### Adding a document

1. Drop the PDF into `docs/`.
2. In `pages.json` → `pages.docs`, set that item's `href` to
   `"docs/filename.pdf"`.

Items with an empty `href` render as "not uploaded" instead of a broken link,
so the list doubles as a checklist of what you still need to request.

### Keeping the offline copy in sync

`app.js` contains a baked-in copy of `pages.json` (between the `__FALLBACK__`
markers) so the page still works opened straight off disk with no server —
useful if you're in a waiting room with no signal.

**If you edit `pages.json`, that baked-in copy goes stale.** To re-sync:

```bash
cd medical
python3 - <<'PY'
import json
data = json.load(open('pages.json'))
src = open('assets/js/app.js').read()
a = src.index('/*__FALLBACK__*/')
b = src.index('/*__END__*/') + len('/*__END__*/')
src = src[:a] + '/*__FALLBACK__*/ ' + json.dumps(data, ensure_ascii=False) + ' /*__END__*/' + src[b:]
open('assets/js/app.js','w').write(src)
print('synced')
PY
```

If you skip it, nothing breaks online — the fetch wins whenever there's a
server. It only matters for the offline copy.

---

## The private supplement — how to open it

Diagnoses, risk history, substance history and forensic context are kept out
of the public folder deliberately. They live in **`NOT-FOR-UPLOAD/`**, which
is not referenced by the deployed site at all. Upload this folder as-is and
none of it goes public.

There are two ways in. Use whichever matches the device.

### On your phone — `private.html`

**`NOT-FOR-UPLOAD/private.html` is a single self-contained file.** All the
styling, all the content and all the code are inside it. No server, no
internet, no other files needed. Double-tap it and it opens.

This is the one to actually use. Put it in your phone's Files app, or email it
to yourself once and keep the attachment, or save it to your phone's home
screen. In a waiting room with no signal it still works.

Same six liveries, same Clinical view button, same Print. There's a red bar
across the top saying **PRIVATE SUPPLEMENT — DO NOT UPLOAD** so you can never
mistake it for the public page.

### On a computer, if you're running the folder on a local server

```bash
cp NOT-FOR-UPLOAD/private.json ./private.json
```

Two extra nav items appear on the main page (Psych detail, Risk history) in
red, plus a "Private supplement loaded" badge in the masthead.

**This only works when the folder is being served** — over `http://`, e.g.
`python3 -m http.server`. Opened straight off disk via `file://`, browsers
block the fetch and nothing appears. That's why `private.html` exists.

**Never run that copy command on the deployed folder.**

### Third option — print it to PDF

Open `private.html`, hit Print, choose Save as PDF. You get a clean
black-and-white handover sheet you can keep in your phone's Files app and
share directly to a clinician through the normal share sheet. For actually
handing something over, this is often the least fiddly of the three.

---

---

## The three buttons

- **Livery dots** — six themes, same as the rest of the system. Default here is
  **Vellum**, not Iron, because this page gets read by strangers on a phone
  under bright hospital lighting. Change the shipped default in
  `index.html` (`data-livery="vellum"`) and `app.js` (`DEFAULT_LIVERY`).
- **Clinical view** — strips the manuscript styling to maximum-contrast black
  on white, sans-serif. This is the one to hit before handing the phone over.
- **Print** — produces a clean handover sheet regardless of what's on screen.
  Decoration, nav and buttons all drop out. Works as Save-as-PDF too, which is
  the version to email ahead or attach to the housing file.

There's also **Copy summary** on the Start here page — puts the short version
on the clipboard as plain text, for pasting into clinical notes or an email.

---

## Deploying

Drop the folder in as a subfolder, same as the others. No build step, plain
HTML/CSS/JS. Fonts load from Google Fonts at runtime.

Worth doing: generate a QR code pointing at the deployed URL, print it small,
keep it in your wallet. Hand that over instead of talking.

---

## What I didn't write

Nothing on this page is invented. Everything factual came from what you've
told me directly. Where I didn't have something, it says `TO FILL` rather than
a plausible guess — particularly medications, diagnoses, and phone numbers.

Two judgement calls flagged for you:

- **The 2019 custodial context** is in the cardiac timeline as one clause,
  because it's where the first episode was detected. Delete it if you'd rather
  it wasn't on a public page — it doesn't change the clinical picture.
- **The litigation** is described only as "civil proceedings relating to
  historical institutional abuse", with a line saying you'll give detail in
  person if it's clinically necessary. Nothing specific, nothing that touches
  the sub judice boundary.


---

## Where the content came from

Everything factual on this page was pulled from your own prior documents and
sessions, not invented:

- Cardiac findings, the troponin-antibody issue, and the April–May 2025
  chest-pain presentations — from your compiled health summary.
- The 2025 sequence and PARC admission — from the chronology you built.
- Care team names (Dr Koutsoukis / Ochre Health, Dr Kaye, Dirk Lynzaat /
  Onshore Counselling, Dr Winton-Brown) — from the same summary.
- The accommodation timeline — from the housing appeal drafts.
- Housing references (CM0079923, Salvos Connect, Warrnambool.Housing) — from
  the complaint correspondence.

**One discrepancy you should settle:** your documents give the start of the
Sturt Street tenancy as both *August 2021* and *2022*. The page currently reads
"2021/2022". Pick whichever is right and make it consistent — housing
correspondence, this page, and the complaint should all say the same thing,
because an inconsistency there is exactly the sort of thing that gets used to
discount the rest.

**Deliberately left off the public page:** all third-party names, the
intervention order matter, anything relating to your daughter, and the
itemised forensic history. The private supplement acknowledges the forensic
history exists and points to the report rather than summarising it.


---

## Update log — 10 August 2026

Added from your own documents and messages:

**Three regimens, in sequence.** An earlier handwritten list (perindopril,
clonidine, metoprolol 50 bd, rosuvastatin, promethazine); the University
Hospital Geelong discharge script (four antihypertensives across four classes,
candesartan 32 mg and amlodipine 10 mg both at max, atorvastatin 80 mg);
and Dr Clissold's written plan of 23 November 2025, which is the one to
rebuild from.

**The December event.** Syncope at the wheel, 17 December 2025 — low BP,
extreme heat, dehydration, on amlodipine + candesartan + metoprolol, with
cannabis the day before. THC on bloods, licence cancelled. This now sits
*above* the January cessation everywhere it appears, because the order is the
whole point: you stopped after an adverse event, not out of disregard.

**Anna's baseline note.** Her line that 150 mmHg systolic might be *below*
what you were used to is quoted on the Medications page. It's a treating
clinician establishing your habitual range in writing — stronger than anything
you or I could assert.

**Transport.** New panel on the Context page. Licence cancelled December 2025,
you're in Koroit, every appointment is in Warrnambool. Framed as a barrier to
care, not a footnote — because it is one, and it belongs in the housing file
too.

**Cannabis** is stated plainly on the Medications page, framed clinically:
postural hypotension risk, and present the day before the syncope. Anyone
rebuilding your antihypertensives needs it in the picture. The legal side is
kept separate — Victoria's drug driving offence is presence-based, so the
cancellation says nothing about whether cannabis caused the faint.

### New TO FILLs worth closing

- **Date of the handwritten regimen.** I've placed it first in the sequence on
  drug-class grounds (perindopril before candesartan, rosuvastatin before
  atorvastatin, clonidine present) but that's inference, not a record.
- **The Geelong admission date**, and what it was for.
- **Medical non-driving period.** A syncopal episode at the wheel usually
  carries a fitness-to-drive restriction separate from the cancellation. Worth
  knowing what applies and what sign-off gets you back on the road — Anna is
  the person for the cardiac side of that.
- **Allergies.** Still blank.

### Records to request

The Geelong material sits with **Barwon Health**, under **Christopher Peter
Greene**. South West Healthcare will not have it. That's a separate records
request from the Warrnambool ones, and it's the admission that established you
as resistant hypertension — worth having.


---

## Update log — 12 August 2026

**The picture resolved into two separate problems.** Five days of readings, plus
the 11 August pair, separated them cleanly:

- **An elevated baseline of roughly 160/95 that does not dip overnight.**
  12:01am on 12 August read 162/99 — essentially unchanged from nine hours
  earlier. BP normally falls 10–20% overnight. Non-dipping is significant on
  its own.
- **Large reactive spikes on top of it.** 197/125 with a pulse of 114 at
  1:30pm on 11 August, after 25 minutes seated and dehydrated. Down to 160/90,
  pulse 91, within 40 minutes on rest and water alone. A sustained baseline
  does not move 37/35 in 40 minutes.

Both are on the page as distinct findings, because they need different answers.

**Current regimen, from 12 August 2026** — prescribed by Dr Clissold on the
11th: aspirin 100 mg daily, **carvedilol 3.125 mg twice daily**, candesartan
8 mg mane. Beta blocker plus ARB covers both the baseline and the tachycardia.

**ALLERGY NOW RECORDED: isosorbide mononitrate — headache.** This was the most
important blank on the site. It's on the front page summary and the
Medications page.

**The Medications page no longer opens with "currently taking nothing."** It
opens with a timeline showing how the seven untreated months happened —
November plan, December syncope, January cessation, August restart. The order
is the argument, and it now reads correctly at a glance.

### Diary item that needs booking

**Carvedilol runs out around 26 August 2026.** 30 tablets, no repeats, twice
daily is roughly 15 days. Dr Clissold is expecting a review before then. With
no GP available until 1 October and no driver's licence, this needs booking
now, not at day 14. It's flagged `TO FILL` on the Right now page — mark it
confirmed once it's in the diary.

### New TO FILLs

- **Chest X-ray result** — taken 11 August, outcome not recorded
- **The right-sided pleuritic pain** — deep, not tender to press, no worse on
  twisting, sharp on deep inspiration. Was it addressed?
- **The rash** — right upper chest, three weeks, same side as the pain
- **Upper-arm cuff** — all readings so far are wrist-cuff, which over-reads if
  the wrist isn't at heart height. Worth confirming whether to switch
- **Other allergies** — one is now recorded; confirm whether there are others

### Still outstanding from earlier

Koroit tenancy start (2021 or 2022) · date of the handwritten regimen · Geelong
admission date · medical non-driving period · which January medications are
still physically held · **renal function** (the left-sided cramping of ~4 August
preceded the whole escalation and remains uninvestigated)
