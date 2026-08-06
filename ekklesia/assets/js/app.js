/* ============================================================
   EKKLESIA 2027 — App
   Fetches pages.json (same-origin data file). If the fetch
   fails — e.g. opened straight from disk via file:// where
   local fetch is blocked — PAGES_FALLBACK below is used
   instead. Keep the two in sync; PAGES_FALLBACK is a verbatim
   copy of pages.json at build time.
   ============================================================ */

(function () {
  "use strict";

  var PAGES_FALLBACK = {
  "site": {
    "name": "EKKLESIA 2027",
    "tagline": "A Southern Summer of Fun and Fellowship",
    "dates": "17 – 26 February 2027",
    "dateStart": "2027-02-17",
    "dateEnd": "2027-02-26",
    "venueName": "New Life Christian Church Grounds",
    "venueAddress": "41 Bromfield Street, Warrnambool VIC 3280, Australia",
    "host": "New Life Christian Church",
    "partner": "For the Love of God — Down Under",
    "contactName": "Rick Clissold",
    "contactEmail": "rclissol1@gmail.com"
  },
  "nav": [
    { "id": "home", "label": "Home" },
    { "id": "program", "label": "Program" },
    { "id": "stay", "label": "Stay" },
    { "id": "visit", "label": "Visit" },
    { "id": "contact", "label": "Contact" }
  ],
  "pages": {
    "home": {
      "eyebrow": "New Life Christian Church · Warrnambool, Victoria",
      "title": "EKKLESIA 2027",
      "subtitle": "A Southern Summer of Fun and Fellowship",
      "dateBadge": "17 – 26 FEBRUARY",
      "venueLine": "New Life Christian Church Grounds · 41 Bromfield Street, Warrnambool VIC Australia",
      "stats": [
        { "value": "10", "label": "Days of Community" },
        { "value": "3", "label": "Days of Encounter" }
      ],
      "cta": [
        { "label": "Email Rick to Register Interest", "href": "mailto:rclissol1@gmail.com?subject=Ekklesia%202027%20%E2%80%93%20Registration%20Interest", "style": "primary" },
        { "label": "See the Program", "href": "#/program", "style": "ghost" }
      ],
      "intro": {
        "heading": "Called out, gathered together",
        "body": [
          "Ekklesia — ἐκκλησία — is the old word for a called-out assembly, the root of the word \u201cchurch\u201d itself. Ten days on the New Life Christian Church grounds in Warrnambool, closing out the Australian summer the way it should be closed out: outdoors, unhurried, and together.",
          "Guest speakers, live music and an arts stream run through the gathering, building toward three dedicated Encounter days. Accommodation and meals are provided, with multiple options to suit families, singles and groups travelling in."
        ]
      },
      "features": [
        { "title": "Guest Speakers", "body": "Teaching and ministry sessions across the ten days, building toward the Encounter days. Lineup to be announced." },
        { "title": "Music", "body": "Live worship and music woven through the program, morning and night." },
        { "title": "Arts", "body": "A creative arts stream for anyone who'd rather make something than just watch it." },
        { "title": "Accommodation & Meals", "body": "Multiple accommodation and meal options are available — get in touch with Rick to find what suits you." }
      ]
    },
    "program": {
      "eyebrow": "What's On",
      "title": "Program",
      "subtitle": "Ten days of community, building to three days of encounter.",
      "sections": [
        {
          "heading": "Guest Speakers",
          "body": "Teaching and ministry sessions run through the gathering. The speaker lineup is still being locked in — check back closer to February, or email Rick to be notified when it's announced."
        },
        {
          "heading": "Music",
          "body": "Live music and worship carry through the program, from casual evening sets to the gathered sessions during the Encounter days."
        },
        {
          "heading": "Arts",
          "body": "A hands-on arts stream runs alongside the main program for anyone who wants to create, not just attend."
        },
        {
          "heading": "The Shape of the Ten Days",
          "body": "The full ten days are open as community — people are welcome to come and go, camp, and take part loosely. Three of those days are set aside as dedicated Encounter days with a tighter, more focused program. Exact dates for the Encounter days will be confirmed with the full schedule."
        }
      ]
    },
    "stay": {
      "eyebrow": "Accommodation & Meals",
      "title": "Where You'll Stay, What You'll Eat",
      "subtitle": "Multiple options are available — nothing is one-size-fits-all.",
      "sections": [
        {
          "heading": "Accommodation",
          "body": "Multiple accommodation options are available on and around the church grounds, from on-site camping to nearby options in Warrnambool. Let Rick know your situation — travelling as a family, a couple, solo, or in a group — and he can point you to what fits."
        },
        {
          "heading": "Meals",
          "body": "Meals are provided across the gathering. If you have dietary requirements or allergies, flag them with Rick when you register so catering can plan for them."
        }
      ],
      "note": "* Multiple options available for both accommodation and meals — get in touch to talk through specifics."
    },
    "visit": {
      "eyebrow": "Getting There",
      "title": "Visit",
      "subtitle": "New Life Christian Church Grounds, Warrnambool VIC.",
      "address": "41 Bromfield Street, Warrnambool VIC 3280, Australia",
      "mapHref": "https://www.google.com/maps/search/?api=1&query=41+Bromfield+Street+Warrnambool+VIC+Australia",
      "sections": [
        {
          "heading": "Where it is",
          "body": "Warrnambool sits on Victoria's south-west coast, at the end of the Great Ocean Road and on the Princes Highway — about a three-hour drive from Melbourne. The gathering runs on the New Life Christian Church grounds at 41 Bromfield Street."
        },
        {
          "heading": "Travel & parking",
          "body": "Details on parking, drop-off and travel into Warrnambool will be shared closer to the date. If you're coming from out of town and want to plan ahead, email Rick."
        }
      ]
    },
    "contact": {
      "eyebrow": "Get in Touch",
      "title": "Contact",
      "subtitle": "Questions, registrations, accommodation, dietary needs — Rick's the one to email.",
      "person": {
        "name": "Rick Clissold",
        "email": "rclissol1@gmail.com",
        "role": "Ekklesia 2027 Coordinator, New Life Christian Church"
      },
      "hosts": [
        { "name": "New Life Christian Church", "note": "Host church and grounds, 41 Bromfield Street, Warrnambool VIC" },
        { "name": "For the Love of God — Down Under", "note": "Event partner" }
      ]
    }
  },
  "footer": {
    "line1": "New Life Christian Church · 41 Bromfield Street, Warrnambool VIC Australia",
    "line2": "Ekklesia 2027 · 17–26 February · in partnership with For the Love of God — Down Under"
  }
};

  var LIVERIES = ["iron", "brass", "vellum", "emerald", "sanctum", "sigil"];
  var LIVERY_KEY = "ekklesia-livery";

  var appEl = document.getElementById("app");
  var navEl = document.getElementById("nav-links");
  var liveryEl = document.getElementById("livery-switch");
  var footerEl = document.getElementById("footer-content");
  var yearEl = document.getElementById("year");

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  /* ---------------- livery switcher ---------------- */

  function applyLivery(name) {
    if (LIVERIES.indexOf(name) === -1) name = "iron";
    document.documentElement.setAttribute("data-livery", name);
    try { localStorage.setItem(LIVERY_KEY, name); } catch (e) {}
    if (liveryEl) {
      Array.prototype.forEach.call(liveryEl.children, function (btn) {
        btn.setAttribute("aria-pressed", btn.dataset.livery === name ? "true" : "false");
      });
    }
  }

  function initLiverySwitch() {
    if (!liveryEl) return;
    liveryEl.innerHTML = "";
    LIVERIES.forEach(function (name) {
      var btn = el("button", {
        type: "button",
        class: "livery-dot livery-dot--" + name,
        "data-livery": name,
        "aria-pressed": "false",
        "aria-label": "Switch to " + name + " livery",
        title: name.charAt(0).toUpperCase() + name.slice(1)
      });
      btn.addEventListener("click", function () { applyLivery(name); });
      liveryEl.appendChild(btn);
    });
    var saved = null;
    try { saved = localStorage.getItem(LIVERY_KEY); } catch (e) {}
    applyLivery(saved || "iron");
  }

  /* ---------------- rendering helpers ---------------- */

  function renderStatPair(stats) {
    var wrap = el("div", { class: "stat-row" });
    stats.forEach(function (s) {
      wrap.appendChild(el("div", { class: "stat" }, [
        el("span", { class: "stat-value" }, [s.value]),
        el("span", { class: "stat-label" }, [s.label])
      ]));
    });
    return wrap;
  }

  function renderCta(items) {
    var wrap = el("div", { class: "cta-row" });
    items.forEach(function (c) {
      wrap.appendChild(el("a", { class: "btn btn--" + (c.style || "primary"), href: c.href }, [c.label]));
    });
    return wrap;
  }

  function renderFeatureGrid(features) {
    var grid = el("div", { class: "feature-grid" });
    features.forEach(function (f) {
      grid.appendChild(el("div", { class: "feature-card" }, [
        el("h3", {}, [f.title]),
        el("p", {}, [f.body])
      ]));
    });
    return grid;
  }

  function renderSections(sections) {
    var wrap = el("div", { class: "section-list" });
    sections.forEach(function (s) {
      wrap.appendChild(el("section", { class: "content-block" }, [
        el("h2", {}, [s.heading]),
        el("p", {}, [s.body])
      ]));
    });
    return wrap;
  }

  /* ---------------- page renderers ---------------- */

  function renderHome(data) {
    var p = data.pages.home;
    var hero = el("section", { class: "hero" }, [
      el("div", { class: "hero-seal", html: SEAL_SVG }),
      el("p", { class: "eyebrow" }, [p.eyebrow]),
      el("h1", { class: "hero-title" }, [p.title]),
      el("p", { class: "hero-subtitle" }, [p.subtitle]),
      el("p", { class: "date-badge" }, [p.dateBadge]),
      el("p", { class: "venue-line" }, [p.venueLine]),
      renderStatPair(p.stats),
      renderCta(p.cta)
    ]);

    var intro = el("section", { class: "content-block intro-block" }, [
      el("h2", {}, [p.intro.heading]),
      ].concat(p.intro.body.map(function (para) { return el("p", {}, [para]); }))
    );

    var features = el("section", { class: "section-list" }, [
      el("h2", { class: "section-heading" }, ["What's Included"]),
      renderFeatureGrid(p.features)
    ]);

    var partner = el("section", { class: "partner-strip" }, [
      el("img", { src: "assets/img/newlife-logo.png", alt: data.site.host, class: "partner-logo" }),
      el("span", { class: "partner-x" }, ["\u00d7"]),
      el("img", { src: "assets/img/ftlog-logo.png", alt: data.site.partner, class: "partner-logo partner-logo--wide" })
    ]);

    appEl.appendChild(hero);
    appEl.appendChild(intro);
    appEl.appendChild(features);
    appEl.appendChild(partner);
  }

  function renderGeneric(pageData) {
    appEl.appendChild(el("header", { class: "page-header" }, [
      el("p", { class: "eyebrow" }, [pageData.eyebrow]),
      el("h1", {}, [pageData.title]),
      el("p", { class: "page-subtitle" }, [pageData.subtitle])
    ]));
    appEl.appendChild(renderSections(pageData.sections));
    if (pageData.note) {
      appEl.appendChild(el("p", { class: "footnote" }, [pageData.note]));
    }
    if (pageData.mapHref) {
      appEl.appendChild(el("div", { class: "cta-row" }, [
        el("a", { class: "btn btn--primary", href: pageData.mapHref, target: "_blank", rel: "noopener" }, ["Open in Google Maps"]),
        el("a", { class: "btn btn--ghost", href: "mailto:" + (window.__EKKLESIA_DATA__.site.contactEmail) }, ["Ask About Travel"])
      ]));
      appEl.appendChild(el("p", { class: "address-line" }, [pageData.address]));
    }
  }

  function renderContact(data) {
    var p = data.pages.contact;
    appEl.appendChild(el("header", { class: "page-header" }, [
      el("p", { class: "eyebrow" }, [p.eyebrow]),
      el("h1", {}, [p.title]),
      el("p", { class: "page-subtitle" }, [p.subtitle])
    ]));

    var card = el("section", { class: "contact-card" }, [
      el("h2", {}, [p.person.name]),
      el("p", { class: "contact-role" }, [p.person.role]),
      el("a", { class: "btn btn--primary", href: "mailto:" + p.person.email + "?subject=Ekklesia%202027" }, [p.person.email])
    ]);
    appEl.appendChild(card);

    var hosts = el("section", { class: "host-list" });
    p.hosts.forEach(function (h) {
      hosts.appendChild(el("div", { class: "host-row" }, [
        el("strong", {}, [h.name]),
        el("span", {}, [h.note])
      ]));
    });
    appEl.appendChild(hosts);
  }

  /* ---------------- signature seal (SVG) ---------------- */

  var SEAL_SVG = [
    '<svg viewBox="0 0 240 240" aria-hidden="true" focusable="false">',
    '<g class="seal-rays">',
    Array.from({ length: 16 }).map(function (_, i) {
      var angle = (360 / 16) * i;
      return '<line x1="120" y1="120" x2="120" y2="18" transform="rotate(' + angle + ' 120 120)" />';
    }).join(""),
    '</g>',
    '<circle class="seal-ring" cx="120" cy="120" r="64" />',
    '<circle class="seal-ring seal-ring--inner" cx="120" cy="120" r="46" />',
    '<text x="120" y="132" text-anchor="middle" class="seal-glyph">E</text>',
    '</svg>'
  ].join("");

  /* ---------------- nav + footer ---------------- */

  function buildNav(data, activeId) {
    navEl.innerHTML = "";
    data.nav.forEach(function (item) {
      var a = el("a", { href: "#/" + item.id, class: item.id === activeId ? "active" : "" }, [item.label]);
      navEl.appendChild(a);
    });
  }

  function buildFooter(data) {
    footerEl.innerHTML = "";
    footerEl.appendChild(el("img", { src: "assets/img/newlife-logo.png", alt: data.site.host, class: "footer-logo" }));
    footerEl.appendChild(el("img", { src: "assets/img/ftlog-logo.png", alt: data.site.partner, class: "footer-logo footer-logo--wide" }));
    var text = el("div", { class: "footer-text" }, [
      el("p", {}, [data.footer.line1]),
      el("p", {}, [data.footer.line2])
    ]);
    footerEl.appendChild(text);
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* ---------------- route dispatch ---------------- */

  function renderRoute(data, id) {
    appEl.innerHTML = "";
    appEl.className = "page page--" + id;
    buildNav(data, id);
    if (id === "home") renderHome(data);
    else if (id === "contact") renderContact(data);
    else renderGeneric(data.pages[id]);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  /* ---------------- boot ---------------- */

  function boot(data) {
    window.__EKKLESIA_DATA__ = data;
    document.title = data.site.name + " — " + data.site.host;
    initLiverySwitch();
    buildFooter(data);
    var ids = data.nav.map(function (n) { return n.id; });
    new window.EkklesiaRouter(ids, "home", function (id) { renderRoute(data, id); });
  }

  fetch("pages.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("bad response");
      return res.json();
    })
    .then(boot)
    .catch(function () { boot(PAGES_FALLBACK); });
})();
