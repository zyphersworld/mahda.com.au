/* ==========================================================================
   app.js — A Permanent Place of Refuge
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
  var DEFAULT_LIVERY = 'vellum';
  var STORE_KEY = 'refuge.livery';

  /* Baked fallback — generated from pages.json at build time so the page still
     works when opened directly from disk. If you edit pages.json on the server,
     this copy goes stale; that only affects file:// preview. */
  var FALLBACK = {
  "meta": {
    "title": "A Permanent Place of Refuge",
    "standfirst": "A proposal for permanent, independent accommodation for survivors of institutional harm.",
    "status": "Discussion draft",
    "version": "v2",
    "updated": "13 August 2026"
  },
  "pages": [
    {
      "id": "home",
      "nav": "The proposal",
      "title": "The proposal",
      "kicker": "Purpose",
      "body": "<p class=\"lede dropcap\">To establish a permanent, independent, non-affiliated place of refuge for people who were harmed in institutions &mdash; childhood care, religious institutions, or any other setting where a duty of care was owed and not met.</p><p>The entity would provide long-term accommodation with secure tenure, alongside the practical and clinical support required to sustain it. It is not affiliated with any church, denomination or institution, and it will not accept funding on terms that create such an affiliation.</p><h3>What this is</h3><ul><li><strong>Permanent accommodation.</strong> Secure tenure, measured in years or for life, not in program cycles.</li><li><strong>Self-contained dwellings.</strong> A person's own front door, kitchen and bathroom.</li><li><strong>Small scale.</strong> Sized to remain domestic rather than institutional.</li><li><strong>Trauma-informed</strong> in design and staffing, with no reproduction of institutional conditions &mdash; no curfews, no communal dining requirement, no shared bathrooms, no loss of autonomy.</li><li><strong>Independent.</strong> Not owned, branded, governed or directed by any church, denomination or institution.</li><li><strong>Open to survivors of harm in any institution</strong>, not only religious ones.</li></ul><h3>What this is not</h3><ul><li>Not crisis or emergency accommodation.</li><li>Not transitional housing with an exit date attached.</li><li>Not a treatment facility, rehabilitation program or clinical service.</li><li>Not a duplication of records access, counselling, advocacy or redress support &mdash; all of which are already delivered well by organisations with decades of expertise, and all of which residents would continue to use.</li><li>Not a religious ministry, and not a vehicle for any denomination's reputational repair.</li></ul>"
    },
    {
      "id": "gap",
      "nav": "The gap",
      "title": "The gap this entity exists to fill",
      "kicker": "The argument",
      "body": "<h3>What already exists</h3><p>Australia has spent two decades building an apparatus around people who were placed in institutional care as children, and around survivors of institutional abuse more broadly. There has been a Senate inquiry and a national apology. There are records services &mdash; Find and Connect nationally, and state finding-records services that index the surviving files. There are dedicated support services in every state, including Open Place in Victoria, providing counselling, advocacy and assistance with records and redress. There has been a Royal Commission, and there is a National Redress Scheme. Care leavers are named in Commonwealth aged care law as a group with special needs.</p><p>In policy terms this is not a forgotten cohort any more. The recognition is real, the services are competent, and the people who work in them are good at their jobs.</p><h3>What none of it provides</h3><div class=\"callout\"><p>Not one of those services can give a person somewhere permanent to live.</p></div><p>Records, counselling, advocacy, a redress payment, an apology, a recognised status in legislation &mdash; all of it is available. Secure tenure is not. There is no service in this system whose output is a roof that the person keeps.</p><p>That matters because housing is precisely where the damage lands. The research on care leavers in mid-life and older age describes the same pattern repeatedly: housing insecurity, dependence on social housing, rental stress, and episodes of homelessness running across the whole adult life course, as a lasting consequence of childhood institutional care rather than as incidental misfortune.</p><p>And the accommodation of last resort &mdash; residential aged care &mdash; is the one form of housing many care leavers will not enter under any circumstances, because it reproduces the conditions of the institution: fixed schedules, communal living, mass-produced food, loss of privacy and possessions, and dependence on strangers for personal care. The research literature on this point is blunt; one study of care leavers' attitudes to aged care took its title from a participant who said they would rather die in the middle of a street.</p><h3>Why redress does not close the gap</h3><p>A redress payment made to a person without secure tenure does not become housing. It is received as a lump sum by someone with no stable base, often no financial scaffolding and frequently significant health needs. It is spent. The housing position afterwards is identical to the housing position before, with the difference that the claim is now extinguished and cannot be made again.</p><p>The sequence this produces is predictable and it is visible in this region: an institution in childhood, five decades of insecure and temporary housing, and an aged care system the person refuses to enter. The system has apologised, documented, counselled and paid. It has not housed.</p><h3>Why South West Victoria</h3><p>The region has its own institutional care history and its own ageing cohort. The Warrnambool Home for Boys was established in Kepler Street in 1972 and moved to Ardlie Street in 1973. After the death of its founder in 1974 the home wound down, and in 1976 the Brophy Memorial Home was established in Dalton Street. Girls were accepted from 1978. It incorporated as Brophy Memorial Hostel in 1982 and the hostel closed in 1994.</p><p>The children who passed through those addresses are now in their fifties, sixties and seventies. Many did not leave the district. They are ageing here, in private rentals, in social housing, in temporary accommodation and in cars, in a regional housing market with almost no vacancy and no category that recognises what happened to them.</p>"
    },
    {
      "id": "structure",
      "nav": "Structure",
      "title": "Proposed structure",
      "kicker": "Governance",
      "body": "<p>An ACNC-registered charity, incorporated as a company limited by guarantee, governed by an independent board recruited at arm's length.</p><p>In the establishment phase the entity would seek to be auspiced by an existing local non-profit rather than carrying full compliance obligations from day one. A longer-range structural option is to partner with a registered Community Housing Agency, with this entity as programme partner rather than capital-and-construction lead &mdash; which would open access to state supported-housing funding rounds without requiring the entity to become a housing developer.</p><h3>The founder's position</h3><p>The founder is a claimant in civil proceedings arising from institutional abuse. The structural proposition is that he forgoes personal financial gain from that claim, and that the value is instead directed to the establishment of this entity.</p><p>In exchange he would hold a defined employed role and long-term accommodation within the facility. Both would be set independently by the board, at arm's length, on terms no more favourable than any other employee or resident. <strong>He would not hold a board seat and would not have governing authority.</strong></p><div class=\"callout\"><p>This arrangement requires legal advice before it is put to any party. It is the subject of a specific question to the founder's solicitor and is not settled.</p></div>"
    },
    {
      "id": "board",
      "nav": "Board sought",
      "title": "Board sought",
      "kicker": "Nobody has been approached",
      "body": "<p>No board members have been appointed and nobody has been approached. The seats below describe what the entity needs, not who will fill them. Recruitment will run through independent channels &mdash; ICDA BoardMatch, Volunteer CONNECT Great South Coast, and CLAN or a comparable network for the lived-experience seat &mdash; rather than through the founder's personal or professional contacts.</p><div class=\"rows\"><div class=\"row\"><div class=\"k\">General practitioner</div><div class=\"v\">Primary-care oversight of residents and a working relationship with local health services. Men's health experience preferred, given the likely resident profile.</div></div><div class=\"row\"><div class=\"k\">Senior clinician</div><div class=\"v\">Trauma-informed practice standards, staff supervision framework, and clinical governance.</div></div><div class=\"row\"><div class=\"k\">Governance / charity law</div><div class=\"v\">ACNC compliance, directors' duties, reporting, and the constitution itself.</div></div><div class=\"row\"><div class=\"k\">Lived experience</div><div class=\"v\">An independent care-leaver or institutional-abuse survivor voice, recruited through an external network &mdash; deliberately not through the founder.</div></div><div class=\"row\"><div class=\"k\">Treasurer / finance</div><div class=\"v\">ACNC reporting and grant acquittals. Unfilled, and non-negotiable before incorporation.</div></div><div class=\"row\"><div class=\"k\">Housing sector</div><div class=\"v\">Someone who has actually operated supported accommodation. Unfilled.</div></div></div><p>A refuge for survivors governed by a single survivor who is also its founder would be a governance weakness. The independent lived-experience seat exists to correct that, and it is deliberately not the founder's.</p>"
    },
    {
      "id": "site",
      "nav": "Site",
      "title": "Site status",
      "kicker": "No site is secured",
      "body": "<div class=\"rows\"><div class=\"row\"><div class=\"k\">Ruled out</div><div class=\"v\"><strong>42 Canterbury Road</strong> &mdash; the former Emmanuel College senior campus. Already sold to a private developer, and in any case owned and sold by Star of the Sea Parish, placing it outside the relevant asset pool.</div></div><div class=\"row\"><div class=\"k\">Ruled out</div><div class=\"v\"><strong>10681 Princes Highway</strong> &mdash; ruled out by the founder on affiliation grounds. A site connected to a family-run religious organisation is incompatible with a non-affiliated refuge.</div></div><div class=\"row\"><div class=\"k\">Live lead</div><div class=\"v\"><strong>Warrnambool City Council land lease</strong>, modelled on the Harrington Road precedent. The original operator withdrew in November 2025 and Council is re-tendering, which may mean both an opportunity and a cautious Council.</div></div></div>"
    },
    {
      "id": "support",
      "nav": "Support sought",
      "title": "Support sought",
      "kicker": "Advocacy and introductions, not money",
      "body": "<p>At this stage the proposal seeks advocacy and introductions rather than funding.</p><ul><li>Introductions to Warrnambool City Council officers who can advise on the land-lease process.</li><li>Introductions to registered Community Housing Agencies open to a partnership discussion.</li><li>Expressions of interest from people qualified to serve on the board.</li><li>Political support for the principle, and for the recognition that permanence is the missing component in an otherwise well-built system.</li><li>Access to regional data on care leavers and institutional-abuse survivors in Barwon South West, which the proposal currently lacks.</li></ul><h3>Next steps</h3><ul><li>Legal advice on the settlement structure before it is put to any party.</li><li>Structural advice through Justice Connect (nfplaw.org.au) on incorporation, ACNC registration and auspicing.</li><li>A named Council contact and the correct process for a land-lease proposal.</li><li>Board recruitment through independent channels, treasurer seat first.</li><li>Regional data to replace the placeholder above.</li></ul>"
    },
    {
      "id": "log",
      "nav": "Log",
      "title": "What has been ruled out, and what is in progress",
      "kicker": "Dated record",
      "body": "<ul class=\"log\"><li><time>13 Aug 2026</time><div>Proposal revised to v2. The gap argument added as the central section: the existing system provides records, counselling, advocacy and redress, and does not provide permanence.</div></li><li><time>Aug 2026</time><div>Regional institutional history confirmed against Find and Connect and the Victorian finding-records service.</div></li><li><time>Aug 2026</time><div>Board candidate names removed in favour of a sought-profile. Two seats ruled out on conflict grounds &mdash; a treating relationship and a personal one.</div></li><li><time>Aug 2026</time><div>Two questions with the founder's solicitor: whether a purpose-directed non-cash settlement term can sit within an individual claim under the current scheme of arrangement, and whether publication carries risk while the claim is frozen.</div></li><li><time>Nov 2025</time><div>Harrington Road: original operator withdrew; Council re-tendering. Precedent still useful, timing uncertain.</div></li><li><time>2025</time><div>42 Canterbury Road ruled out &mdash; sold, and outside the relevant asset pool.</div></li><li><time>2025</time><div>10681 Princes Highway ruled out by the founder on affiliation grounds.</div></li></ul>"
    },
    {
      "id": "contact",
      "nav": "Contact",
      "title": "Contact and status",
      "kicker": "Discussion draft",
      "body": "<p>This document is a discussion draft. It has not been published, no site has been secured, no board exists, no entity has been incorporated and nobody has been approached to serve. It is circulated for comment only, and is subject to legal clearance before any public step is taken.</p><div class=\"rows\"><div class=\"row\"><div class=\"k\">Prepared by</div><div class=\"v\">Mahda Christopher Greene</div></div><div class=\"row\"><div class=\"k\">Location</div><div class=\"v\">Koroit, Victoria</div></div><div class=\"row\"><div class=\"k\">Email</div><div class=\"v\"><a href=\"mailto:mahdagreenemoon@gmail.com\">mahdagreenemoon@gmail.com</a></div></div></div><h3>Sources</h3><p>The housing-outcomes argument rests on Coram et al., &ldquo;Lasting legacies: meeting the housing needs of Forgotten Australians from mid-life to older age&rdquo;, <em>Australian Journal of Social Issues</em> (2022). The aged care argument rests on Browne-Yung et al., &ldquo;&lsquo;I&rsquo;d rather die in the middle of a street&rsquo;: perceptions and expectations of aged care among Forgotten Australians&rdquo;, <em>Australasian Journal on Ageing</em> (2021). The regional institutional history is drawn from Find and Connect and the Victorian finding-records service.</p><div class=\"btnrow\"><a class=\"btn\" href=\"docs/A_Permanent_Place_of_Refuge_Proposal_v2.docx\">Download the full proposal (DOCX)</a><a class=\"btn\" href=\"#\" onclick=\"window.print();return false;\">Print this page</a></div>"
    }
  ]
};

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
    document.title = pg.title + ' \u00b7 ' + (data.meta && data.meta.title || 'A Permanent Place of Refuge');
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
