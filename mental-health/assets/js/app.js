/* ==========================================================================
   app.js — Right Now (mental health status page)
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
  var STORE_KEY = 'mentalhealth.livery';

  /* Baked fallback — generated from pages.json at build time so the page still
     works when opened directly from disk. If you edit pages.json on the server,
     this copy goes stale; that only affects file:// preview. */
  var FALLBACK = {"meta": {"title": "Right Now", "standfirst": "A direct explanation, so I don't have to give it in person right now.", "status": "Personal, unlisted", "version": "v2", "updated": "17 August 2026"}, "pages": [{"id": "home", "nav": "Right now", "title": "Right now", "kicker": "Written by me, current as of the date above", "body": "<p class=\"lede dropcap\">I'm managing a manic episode. It reached a physical crisis point overnight on 15–16 August — a sustained hypertensive spike and about 48 hours of dissociation and unsteadiness. I've disclosed this to my treating specialist, and we agree a formal mental health plan is needed. I've been referred to Jayce at Warrnambool Adult Mental Health Team — appointment pending.</p><p>I've also raised something else with her directly: periods of memory gaps for my own recent actions, and weeks that have felt fuzzy or dream-like. That's being assessed as part of the same referral. I'm naming it here because I'd rather you hear it from me, plainly, than piece it together or wonder what's not being said.</p><p>I'm safe. I'm not in immediate danger. This isn't a crisis in progress — it's a real, ongoing thing I'm actively managing with medical support, not something I'm hiding or pretending isn't happening.</p><p>If you've been sent this link, it's because explaining all of this out loud, in the moment, takes energy I don't always have to spare right now. This page says it once, properly, so I don't have to keep saying it.</p><div class=\"callout\"><p>If you're worried about me right now specifically — not about the general situation, but about this moment — see <a href=\"#/who\">Who to call</a>.</p></div>"}, {"id": "pattern", "nav": "The pattern, plainly", "title": "The pattern, plainly", "kicker": "What's actually been happening", "body": "<p>Over recent weeks I've been running a lot of projects in parallel — creative, legal, technical, advocacy — at a pace and volume well beyond my normal baseline. That's not a vague impression; it's on record. The number of concurrent projects grew from around three in mid-June to eight from late July onward. Working sessions after midnight clustered specifically in the two highest-intensity weeks. The single largest piece of work in the whole period was finished on 15 August — the day before the crisis.</p><p>Real work has come out of it — that part is true, and it can make the underlying pattern easy to miss or wave away, including by me. Ideas have arrived quickly and fully formed. Long stretches have passed without much sleep, without feeling particularly tired.</p><p>Two other things are part of the honest picture, not separate from it:</p><ul><li><strong>Memory gaps.</strong> Periods of finding work I'd clearly started, with no memory of starting it, alongside stretches of time that felt fuzzy or dream-like rather than solid. I've raised this directly with my treating specialist. It's being assessed, not settled, and not something I'm putting a label on myself.</li><li><strong>Some self-caught moments, inside the pattern.</strong> I paused a planned in-person meeting at one point specifically because I recognised I needed to slow down. I told my daughter directly, separately, that I was managing something that meant taking things slowly. Worth knowing the awareness hasn't been entirely absent — it just hasn't been enough on its own.</li></ul><p>That pace built for roughly two weeks before it reached a physical breaking point: the sustained hypertensive crisis and about 48 hours of dissociation on 15–16 August. That's not a separate, unrelated health scare. It's the same pattern, showing up in the body once it couldn't keep going the way it had been.</p><p>Part of what's underneath this period, worth naming honestly rather than leaving as a gap: for several years I was a carer for someone I loved deeply, in a role that asked a lot of me and that I took seriously. That role, and the relationship it was part of, ended. I've been carrying real grief about it that I haven't always given proper space to, underneath everything else that's been happening. This week, some of that surfaced directly, for the first time in a while. It's mine to carry, not something I'm going to detail further here, but it's part of the honest picture of what's been sitting underneath the pace of these last weeks.</p><p>I've named all of this to my treating specialist directly, and I'm working with her on an actual plan — not just a conversation about it once. That's the honest, current state of things.</p>"}, {"id": "help", "nav": "If you're trying to help", "title": "If you're trying to help", "kicker": "What actually helps, and what doesn't", "body": "<h3>What helps</h3><ul><li>Believing me when I say I'm tired, even if I seem energetic or productive — the two aren't the same thing right now.</li><li>Simple, practical things: checking in briefly, food, not needing a long conversation every time.</li><li>Saying something once rather than repeating the same concern several times — I've usually already heard it.</li><li>Respecting it when I say I need space, and also when I say I need someone there — both are real, at different times.</li></ul><h3>What doesn't help</h3><ul><li>Panic, or treating this as an emergency it isn't — see <a href=\"#/who\">Who to call</a> for when it actually is one.</li><li>Trying to resolve it in one conversation. It isn't going to resolve in one conversation.</li><li>Bringing it up with other people without asking me first.</li><li>Ultimatums, or framing this as a choice I'm making badly rather than something I'm actively getting support for.</li></ul>"}, {"id": "who", "nav": "Who to call", "title": "Who to call", "kicker": "Real numbers, current as of the date above", "body": "<div class=\"rows\"><div class=\"row\"><div class=\"k\">Emergency</div><div class=\"v\"><a href=\"tel:000\">000</a> — if this is a genuine emergency, right now.</div></div><div class=\"row\"><div class=\"k\">SWH Mental Health Triage</div><div class=\"v\"><a href=\"tel:1800808284\">1800 808 284</a> — South West Healthcare, 24/7.</div></div><div class=\"row\"><div class=\"k\">NURSE-ON-CALL</div><div class=\"v\"><a href=\"tel:136024\">1300 60 60 24</a> — statewide, 24/7.</div></div><div class=\"row\"><div class=\"k\">Lifeline</div><div class=\"v\"><a href=\"tel:131114\">13 11 14</a> — 24/7 crisis support.</div></div><div class=\"row\"><div class=\"k\">My specialist clinic</div><div class=\"v\">Specialist Outpatient Clinic, South West Healthcare — <a href=\"tel:0355631256\">(03) 5563 1256</a>, business hours.</div></div></div>"}, {"id": "faq", "nav": "Common questions", "title": "Common questions", "kicker": "Things people usually ask", "body": "<h3>Is this the first time?</h3><p>No. It's a pattern I'm working on understanding and managing properly, not a single one-off event.</p><h3>What's this about memory gaps — is that serious?</h3><p>It's real, and I'm not going to pretend it isn't. It's also genuinely being assessed, not diagnosed by me on a website. I'd rather name it plainly than have it be the thing nobody mentions.</p><h3>Should I call an ambulance?</h3><p>Only if there's a genuine emergency happening right now — not because you're worried about the general situation. If you're unsure, NURSE-ON-CALL (1300 60 60 24) can help you work out what's actually needed.</p><h3>What can I actually do right now?</h3><p>Honestly, probably less than it feels like. Reading this page is most of it. See <a href=\"#/help\">If you're trying to help</a> for the rest.</p><h3>Are you getting help?</h3><p>Yes. I've disclosed this to my treating specialist and we're putting a formal plan in place, including a referral to Warrnambool Adult Mental Health Team. This page exists because that process is real and ongoing, not instead of it.</p>"}]};

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
    document.title = pg.title + ' \u00b7 ' + (data.meta && data.meta.title || 'Right Now');
    main.setAttribute('tabindex', '-1');
    // Deliberately no analytics on this page. It's personal and unlisted —
    // whoever's reading it shouldn't be tracked for doing so.
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
