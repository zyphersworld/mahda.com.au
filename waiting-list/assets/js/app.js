/* ==========================================================================
   app.js — The Waiting List
   Same architecture as mahda.com.au / gasc / ekklesia / medical:
     · same-origin pages.json drives all content
     · a baked-in FALLBACK array so the page works from file:// with no server
     · hash router (#/id) so every section is shareable and back works
     · six-livery switcher with crossfade, persisted to localStorage
   Editing copy: change pages.json only. Nothing here needs touching.
   ========================================================================== */
(function () {
  'use strict';

  var LIVERIES = [
    { id: 'vellum',  label: 'Vellum',  swatch: '#efe7d4' },
    { id: 'brass',   label: 'Brass',   swatch: '#d9a441' },
    { id: 'iron',    label: 'Iron',    swatch: '#3a4148' },
    { id: 'emerald', label: 'Emerald', swatch: '#2f5340' },
    { id: 'sanctum', label: 'Sanctum', swatch: '#3a3468' },
    { id: 'sigil',   label: 'Sigil',   swatch: '#d4358f' }
  ];
  var DEFAULT_LIVERY = 'iron';
  var STORE_KEY = 'reckoning.livery';

  /* Baked fallback — generated from pages.json at build time so the page still
     works when opened directly from disk. If you edit pages.json on the server,
     this copy goes stale; that only affects file:// preview. */
  var FALLBACK = {"meta": {"title": "The Waiting List", "standfirst": "A public, dated record of a DFFH Priority Access housing complaint — the facts, the timeline, and the pattern of other people hitting the same wall.", "status": "Live tracking", "version": "v1", "updated": "14 August 2026, afternoon"}, "pages": [{"id": "home", "nav": "Overview", "title": "Overview", "kicker": "What this is", "body": "<p class=\"lede dropcap\">This page exists because a single complaint is easy to dismiss and a pattern is not. It's a dated, factual record of a Priority Access housing application with Victoria's Department of Families, Fairness and Housing — kept in one place, updated as things change, and built to be handed to anyone who needs the whole picture at once: a journalist, an MP's office, or the Victorian Ombudsman.</p><div class=\"rows\"><div class=\"row\"><div class=\"k\">Application</div><div class=\"v\">7105877341, effective 7 April 2026. Status: Priority Pending Recommendation.</div></div><div class=\"row\"><div class=\"k\">Complaint</div><div class=\"v\">CM0079923. Department's own stated response window runs to 20 August 2026.</div></div><div class=\"row\"><div class=\"k\">Housing history</div><div class=\"v\">No secure accommodation since February 2025. Six placements. Currently residing in a caravan, Koroit.</div></div><div class=\"row\"><div class=\"k\">The property in question</div><div class=\"v\">A property in Koroit — occupied for approximately three years until February 2025, vacant since. Address withheld to protect nearby family members’ privacy.</div></div><div class=\"row\"><div class=\"k\">Next deadline</div><div class=\"v\">21 August 2026 — Victorian Ombudsman referral if the complaint window closes without resolution.</div></div></div><h3>Why this exists</h3><p>Individually, delays like this are easy for a system to treat as one person's bad luck. Since going public, this hasn't looked like one person's bad luck — see <a href=\"#/pattern\">The Pattern</a> for other people's accounts of the same wait, the same system, in their own words.</p>"}, {"id": "timeline", "nav": "Timeline", "title": "Timeline", "kicker": "Dated record", "body": "<ul class=\"log\"><li><time>Feb 2025</time><div>Left a property in Koroit after approximately three years. No secure accommodation since. The property has remained vacant. (Address withheld here to protect nearby family members’ privacy — the same standard applied to the public Facebook post.)</div></li><li><time>7 Apr 2026</time><div>Priority Access application lodged. Reference 7105877341.</div></li><li><time>6 Aug 2026</time><div>Jacinta Ermacora MP (Member for Western Victoria) contacted. No response to date.</div></li><li><time>7–10 Aug 2026</time><div>Sustained, escalating blood pressure readings, peaking at 228/149.</div></li><li><time>12 Aug 2026</time><div>Three-drug treatment regimen commenced under treating specialist. Specialist support letter completed and sent to DFFH, Salvos Connect, and Roma Britnell MP's office. Forwarded independently by Salvos caseworker.</div></li><li><time>12 Aug 2026</time><div>Roma Britnell MP (Member for South West Coast) responded, encouraging the application and confirming a ministerial representation was underway.</div></li><li><time>13 Aug 2026</time><div>Acute health episode — blood pressure to 195/123 with transient neurological-type symptoms, resolved without hospital presentation, following clinical guidance.</div></li><li><time>14 Aug 2026</time><div>Public post published to two local Facebook community groups. Substantial organic reach within hours — see <a href=\"#/reach\">Reach</a>.</div></li><li><time>14 Aug 2026</time><div>Outreach sent to local media regarding the housing situation specifically, as a follow-up to an earlier, broader approach made in June.</div></li><li><time>20 Aug 2026 (scheduled)</time><div>DFFH's stated complaint response window closes. Also the date of a previously scheduled echocardiogram.</div></li><li><time>21 Aug 2026 (scheduled)</time><div>Victorian Ombudsman referral, if the complaint remains unresolved.</div></li></ul>"}, {"id": "pattern", "nav": "The Pattern", "title": "The pattern", "kicker": "Other people, same system, their own words", "body": "<p>The public post asked a simple question: if you've hit something similar with DFFH or Priority Access housing, say so. Within a day, this is what came back. Presented as offered, in public community groups, first names as given.</p><div class=\"rows\"><div class=\"row\"><div class=\"k\">Cathy</div><div class=\"v\">On the general waiting list over 10 years. Her son was recently rejected for priority housing. She continues working into her 70s to house him.</div></div><div class=\"row\"><div class=\"k\">A parent, Hamilton</div><div class=\"v\">Daughter on the priority list 6 years. Told to expect a wait of 10-plus years.</div></div><div class=\"row\"><div class=\"k\">John</div><div class=\"v\">Applied 3 years ago. No response despite repeated calls.</div></div><div class=\"row\"><div class=\"k\">Fiona</div><div class=\"v\">On a single-unit list for 3 years, statewide. Told by phone that approximately 60,000 Victorians are currently on the waiting list. (Figure as reported to her; not yet independently verified — see note below.)</div></div><div class=\"row\"><div class=\"k\">A commenter on emergency accommodation funding</div><div class=\"v\">Reported that Salvos-funded hotel accommodation for homeless families is generally capped around six weeks before families are without a placement again while reapplying. (Figure given as a rough impression by the commenter, not confirmed against a funding document.)</div></div></div><div class=\"callout\"><p>Two figures on this page — the 60,000 statewide waitlist number and the six-week hotel funding cap — were reported by other people in the thread from memory or hearsay, not sourced documents. Worth verifying independently before quoting either to a journalist, MP office, or the Ombudsman.</p></div>"}, {"id": "health", "nav": "Health evidence", "title": "The health evidence", "kicker": "Documented, not asserted", "body": "<p>The argument this record makes isn't that bureaucratic delay is unpleasant. It's that this specific delay has coincided with a documented, escalating health event, and that the coincidence is now on the record with a treating specialist.</p><div class=\"rows\"><div class=\"row\"><div class=\"k\">Diagnoses</div><div class=\"v\">Hypertensive cardiomyopathy, left ventricular hypertrophy, coronary microvascular dysfunction, chronic myocardial ischaemia. A 2019 angiogram excluded obstructive coronary disease.</div></div><div class=\"row\"><div class=\"k\">Crisis readings</div><div class=\"v\">7–10 August 2026, peaking at 228/149, while unmedicated.</div></div><div class=\"row\"><div class=\"k\">Treatment</div><div class=\"v\">Three-drug regimen commenced 12 August 2026 under a treating specialist at South West Healthcare.</div></div><div class=\"row\"><div class=\"k\">Specialist letter</div><div class=\"v\">Completed 12 August 2026, supporting the housing application on medical grounds. Provided to DFFH, Salvos Connect, and the local MP's office.</div></div><div class=\"row\"><div class=\"k\">13 August episode</div><div class=\"v\">A further acute rise to 195/123 with transient, one-sided neurological-type symptoms. Assessed against clinical guidance and did not require hospital presentation. Documented and reported to the treating specialist the same evening.</div></div></div><p>This section will be updated as further clinical detail becomes appropriate to make public. It is not a substitute for the full medical record, which is held privately.</p>"}, {"id": "reach", "nav": "Reach", "title": "Public reach", "kicker": "Tracked, updated as it moves", "body": "<p>The public post was shared to two local Facebook community groups on 14 August 2026. Reach is tracked here as a factual record of public interest, not as a campaign metric.</p><div class=\"rows\"><div class=\"row\"><div class=\"k\">Combined views</div><div class=\"v\">Approximately 14,900 as at the afternoon of 14 August 2026, and continuing to move.</div></div><div class=\"row\"><div class=\"k\">Unique viewers</div><div class=\"v\">Approximately 7,900 individual people across both groups.</div></div><div class=\"row\"><div class=\"k\">Engagement</div><div class=\"v\">Over 2,100 combined likes, comments and reactions.</div></div><div class=\"row\"><div class=\"k\">Pattern of response</div><div class=\"v\">Multiple independent commenters came forward with directly comparable experiences within hours — see <a href=\"#/pattern\">The Pattern</a>.</div></div></div><p>These figures are read directly from the platform's own analytics and updated by hand. They are not independently audited.</p>"}, {"id": "contacts", "nav": "Who's involved", "title": "Who's involved", "kicker": "Named where responsive, unnamed where not appropriate", "body": "<div class=\"rows\"><div class=\"row\"><div class=\"k\">Roma Britnell MP</div><div class=\"v\">Member for South West Coast. Responded 12 August 2026, encouraging and supportive. Making a ministerial representation on this matter.</div></div><div class=\"row\"><div class=\"k\">Jacinta Ermacora MP</div><div class=\"v\">Member for Western Victoria. Contacted 6 August 2026. No response to date.</div></div><div class=\"row\"><div class=\"k\">Salvos Connect</div><div class=\"v\">Caseworker support engaged throughout. Forwarded the specialist support letter independently.</div></div><div class=\"row\"><div class=\"k\">Treating specialist</div><div class=\"v\">South West Healthcare. Provided the 12 August support letter and has been monitoring the health situation throughout.</div></div></div><p>This record deliberately does not name individual departmental staff. The position throughout has been that this is a systems problem, not a person problem — several individuals in this process have been genuinely responsive, and the record should reflect that rather than obscure it.</p>"}, {"id": "status", "nav": "Status & next steps", "title": "Status and next steps", "kicker": "What happens, and when", "body": "<div class=\"rows\"><div class=\"row\"><div class=\"k\">Now – 20 Aug</div><div class=\"v\">Awaiting DFFH's response within its own stated complaint window.</div></div><div class=\"row\"><div class=\"k\">20 Aug</div><div class=\"v\">Complaint window closes.</div></div><div class=\"row\"><div class=\"k\">21 Aug</div><div class=\"v\">If unresolved, referral to the Victorian Ombudsman.</div></div><div class=\"row\"><div class=\"k\">Ongoing</div><div class=\"v\">This page will be updated as the complaint, the health record, and public reach develop. Nothing on this page is final.</div></div></div><div class=\"callout\"><p>This is a live record, not a finished account. Figures, especially reach figures, will change. Check the “updated” date at the top of the page.</p></div>"}, {"id": "contact", "nav": "Contact", "title": "Contact", "kicker": "Get in touch", "body": "<p>This record is maintained by the person it concerns, in his own name, as a factual account rather than an anonymous complaint.</p><div class=\"rows\"><div class=\"row\"><div class=\"k\">Name</div><div class=\"v\">Mahda Christopher Greene</div></div><div class=\"row\"><div class=\"k\">Location</div><div class=\"v\">Koroit, Victoria</div></div><div class=\"row\"><div class=\"k\">Email</div><div class=\"v\"><a href=\"mailto:mahdagreenemoon@gmail.com\">mahdagreenemoon@gmail.com</a></div></div></div><div class=\"btnrow\"><a class=\"btn\" href=\"#\" onclick=\"window.print();return false;\">Print this page</a></div>"}]};

  var data = null;

  /* ---------------------------------------------------------------- liveries */
  function readStored() {
    try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function writeStored(v) {
    try { window.localStorage.setItem(STORE_KEY, v); } catch (e) { /* private mode */ }
  }

  function applyLivery(id, animate) {
    var valid = LIVERIES.some(function (l) { return l.id === id; });
    if (!valid) id = DEFAULT_LIVERY;

    var fade = document.querySelector('.theme-fade');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function set() {
      document.documentElement.setAttribute('data-theme', id);
      writeStored(id);
      Array.prototype.forEach.call(
        document.querySelectorAll('.liveries button'),
        function (b) { b.setAttribute('aria-pressed', String(b.dataset.livery === id)); }
      );
    }

    if (animate && fade && !reduce) {
      fade.classList.add('on');
      window.setTimeout(function () {
        set();
        window.setTimeout(function () { fade.classList.remove('on'); }, 20);
      }, 180);
    } else {
      set();
    }
  }

  function buildLiveryControls() {
    var host = document.getElementById('liveries');
    if (!host) return;
    LIVERIES.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.livery = l.id;
      b.title = l.label;
      b.setAttribute('aria-label', 'Livery: ' + l.label);
      b.setAttribute('aria-pressed', 'false');
      b.style.setProperty('--swatch', l.swatch);
      b.addEventListener('click', function () { applyLivery(l.id, true); });
      host.appendChild(b);
    });
  }

  /* ------------------------------------------------------------------ router */
  function currentId() {
    var h = window.location.hash.replace(/^#\/?/, '').trim();
    return h || 'home';
  }

  function findPage(id) {
    if (!data || !data.pages) return null;
    for (var i = 0; i < data.pages.length; i++) {
      if (data.pages[i].id === id) return data.pages[i];
    }
    return null;
  }

  function buildNav() {
    var nav = document.getElementById('nav');
    if (!nav || !data) return;
    nav.innerHTML = '';
    data.pages.forEach(function (pg, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'plaque';
      b.dataset.target = pg.id;
      b.innerHTML = '<span class="num">' +
        String(i + 1).padStart(2, '0') + '</span>' + escapeHtml(pg.nav || pg.title);
      b.addEventListener('click', function () { window.location.hash = '#/' + pg.id; });
      nav.appendChild(b);
    });
  }

  function markNav(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.plaque'), function (b) {
      if (b.dataset.target === id) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    var id = currentId();
    var pg = findPage(id) || findPage('home');
    var main = document.getElementById('main');
    if (!main) return;

    if (!pg) {
      main.innerHTML = '<section class="panel"><h2>Content not loaded</h2>' +
        '<p>pages.json could not be read and no fallback is present. ' +
        'Serve this folder over http rather than opening the file directly.</p></section>';
      return;
    }

    main.innerHTML =
      '<section class="panel" aria-labelledby="pg-title">' +
        (pg.kicker ? '<p class="kicker">' + escapeHtml(pg.kicker) + '</p>' : '') +
        '<h2 id="pg-title">' + escapeHtml(pg.title) + '</h2>' +
        pg.body +
      '</section>';

    markNav(pg.id);
    document.title = pg.title + ' \u00b7 ' + (data.meta && data.meta.title || 'The Waiting List');
    main.setAttribute('tabindex', '-1');
  }

  /* ------------------------------------------------------------------- boot */
  function fillMeta() {
    if (!data || !data.meta) return;
    var m = data.meta;
    var t = document.getElementById('mast-title');
    var s = document.getElementById('mast-standfirst');
    var st = document.getElementById('docket-status');
    var vr = document.getElementById('docket-version');
    var up = document.getElementById('docket-updated');
    if (t) t.textContent = m.title;
    if (s) s.textContent = m.standfirst;
    if (st) st.textContent = m.status;
    if (vr) vr.textContent = m.version;
    if (up) up.textContent = m.updated;
  }

  function start(loaded) {
    data = loaded;
    fillMeta();
    buildNav();
    render();
    window.addEventListener('hashchange', render);
  }

  function boot() {
    applyLivery(readStored() || DEFAULT_LIVERY, false);
    buildLiveryControls();

    fetch('pages.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(start)
      .catch(function () { start(FALLBACK); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
