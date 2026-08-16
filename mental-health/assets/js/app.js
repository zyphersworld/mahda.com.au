/* ==========================================================================
   app.js — Mental Health
   mahda.com.au/mental-health/

   Architecture matches the other subfolder sites:
     - content from same-origin pages.json
     - PAGES_FALLBACK baked in, so the page still works if pages.json 404s
       or the site is opened straight off disk
     - hash router (#/id), six-livery switcher persisted to localStorage

   Extra here, borrowed from the medical handover site: a "Plain view"
   high-contrast toggle and copy-to-clipboard, both aimed at someone
   reading this cold, on a phone, possibly in a hurry.
   ========================================================================== */
(function () {
  "use strict";

  /* Deploy path, absolute. A relative path silently resolves against the
     domain root when the visitor lands on /mental-health with no trailing
     slash, which 404s every asset. */
  var BASE = "/mental-health/";

  var PAGES_FALLBACK = {
    "meta": { "title": "Mental Health — Mahda Greene", "updated": "16 August 2026" },
    "nav": [
      { "id": "status", "label": "Right Now" },
      { "id": "pattern", "label": "The Pattern" },
      { "id": "help", "label": "How to Help" },
      { "id": "contacts", "label": "Who to Call" },
      { "id": "faq", "label": "Common Questions" }
    ],
    "pages": [
      { "id": "status", "title": "Right Now", "eyebrow": "Start here",
        "content": "<p class=\"lede\">If I sent you this link instead of explaining something out loud, this is why. It's easier for me to write this once, carefully, than to say it well in the middle of things.</p><div class=\"statusbox\"><p class=\"statuslabel\">Current status &mdash; <span class=\"statusdate\">[update this date]</span></p><p class=\"statustext\">[One line, plain: what's going on right now, and what's being done about it. Edit this block whenever you send the link &mdash; everything else on the site stays as-is.]</p></div><p>Everything else here is permanent background &mdash; the pattern, how to actually help, and who to call. It doesn't change day to day, so it's safe to send this link to someone once and not worry about it going stale.</p><p>Start with <a href=\"#/pattern\">The Pattern</a> if this is the first time someone's reading it. Go straight to <a href=\"#/contacts\">Who to Call</a> if something's urgent.</p>" },
      { "id": "pattern", "title": "The Pattern, Plainly", "eyebrow": "Background",
        "content": "<p class=\"lede\">This isn't a diagnosis. I'm not qualified to give myself one and I'm not going to put a label here that hasn't come from someone who is. This is what I've observed, described plainly.</p><p>I go through periods &mdash; this current one has been building for weeks &mdash; where output goes up a lot. Several projects at once, across completely different areas, all of them getting finished rather than just started. Sleep need drops, and it doesn't register as tiredness the way it normally would.</p><p><strong>The part people usually miss: it doesn't look like a crisis from the outside.</strong> It looks like I'm doing unusually well &mdash; calm, fluent, on top of things. That smoothness is the signal, not the absence of one. If I seem more capable than usual and you know something's off underneath, trust the second thing.</p><p>My body tends to register it even when I don't &mdash; blood pressure that won't settle, especially overnight, has been the clearest physical marker so far. I have a documented cardiac history that makes this more than a background detail.</p><p>I'm working with my treating specialist and reconnecting with the local Adult Mental Health Team on a proper plan. This page will be updated as that develops.</p>" },
      { "id": "help", "title": "If You're Trying to Help", "eyebrow": "Practical",
        "content": "<p class=\"lede\">Short version: say it plainly, once, and don't mistake calm for fine.</p><h3>Do</h3><ul><li>Take physical complaints seriously, blood pressure especially &mdash; I have a real cardiac history, and it's usually the more reliable signal.</li><li>Ask directly rather than guess. &ldquo;Have you slept? Have you eaten?&rdquo; gets further than &ldquo;are you okay?&rdquo;</li><li>Push for rest over reassurance. I don't need to hear the ideas are good. I need to hear it's time to stop for the night.</li><li>If I seem unusually calm, articulate and productive rather than obviously distressed, don't take that as evidence everything's fine. Read <a href=\"#/pattern\">The Pattern</a>.</li><li>Say the serious thing once, clearly. I'll hear it. I don't need it repeated four different ways.</li></ul><h3>Don't</h3><ul><li>Don't try to argue me out of something mid-flow. It doesn't work and it burns the conversation. Suggest sleep, food or a pause instead of debating the idea itself.</li><li>Don't assume high output means things are fine. For me it's frequently the opposite signal.</li><li>Don't sit on a real concern to keep things comfortable. Awkward and said once beats smooth and unsaid.</li></ul><p>If something is genuinely urgent, skip straight to <a href=\"#/contacts\">Who to Call</a>.</p>" },
      { "id": "contacts", "title": "Who to Call", "eyebrow": "Contacts",
        "content": "<div class=\"contactcard urgent\"><p class=\"contactlabel\">Immediate danger &mdash; chest pain, breathlessness, confusion, safety concern</p><p class=\"contactnum\"><a href=\"tel:000\">000</a></p></div><div class=\"contactcard\"><p class=\"contactlabel\">South West Healthcare &mdash; Mental Health Triage (24/7, Warrnambool &amp; Glenelg region)</p><p class=\"contactnum\"><a href=\"tel:1800808284\">1800 808 284</a></p><p class=\"contactnote\">This is the right first call for a mental health concern that isn't an emergency &mdash; not a last resort. If you're holding my phone because I've handed it to you, this is the number.</p></div><div class=\"contactcard\"><p class=\"contactlabel\">Nurse-on-Call (24/7, physical health &amp; triage)</p><p class=\"contactnum\"><a href=\"tel:1300606024\">1300 60 60 24</a></p></div><div class=\"contactcard\"><p class=\"contactlabel\">Lifeline (24/7)</p><p class=\"contactnum\"><a href=\"tel:131114\">13 11 14</a></p></div><div class=\"contactcard\"><p class=\"contactlabel\">My treating specialist &mdash; Specialist Outpatient Clinic, South West Healthcare</p><p class=\"contactnum\"><a href=\"tel:0355631256\">(03) 5563 1256</a></p></div>" },
      { "id": "faq", "title": "Common Questions", "eyebrow": "FAQ",
        "content": "<div class=\"faqitem\"><p class=\"faqq\">He seems completely fine, really sharp and productive &mdash; are you sure?</p><p class=\"faqa\">That's the pattern, not evidence against it. See <a href=\"#/pattern\">The Pattern</a>.</p></div><div class=\"faqitem\"><p class=\"faqq\">Should I call someone right now?</p><p class=\"faqa\">If there's a direct safety concern, yes &mdash; 000. Otherwise the mental health triage line is the right first call, not something to hold off on. See <a href=\"#/contacts\">Who to Call</a>.</p></div><div class=\"faqitem\"><p class=\"faqq\">Is this a diagnosis? Is it permanent?</p><p class=\"faqa\">No label here is final. This page describes an observed pattern, not a clinical diagnosis. That's between me and my treating team.</p></div><div class=\"faqitem\"><p class=\"faqq\">What do I actually say to him?</p><p class=\"faqa\">Plainly, and once. Repeating it four ways doesn't help &mdash; saying it clearly the first time does.</p></div><div class=\"faqitem\"><p class=\"faqq\">Why does this page exist instead of him just telling people?</p><p class=\"faqa\">Because writing it once, carefully, when it's easier to think clearly, works better than explaining it live, in the moment, when it usually isn't.</p></div>" }
    ]
  };

  var LIVERIES = ["vellum", "brass", "iron", "emerald", "sanctum", "sigil"];
  var LIVERY_LABELS = {
    vellum: "Vellum", brass: "Brass", iron: "Iron",
    emerald: "Emerald", sanctum: "Sanctum", sigil: "Sigil"
  };
  var DEFAULT_LIVERY = "vellum";
  var LS_LIVERY = "mahda.mentalhealth.livery";
  var LS_PLAIN = "mahda.mentalhealth.plain";

  var DATA = null;
  var router = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }

  /* ---------------- livery + plain view ---------------- */
  function applyLivery(name) {
    var v = LIVERIES.indexOf(name) >= 0 ? name : DEFAULT_LIVERY;
    document.documentElement.setAttribute("data-livery", v);
    try { localStorage.setItem(LS_LIVERY, v); } catch (e) {}
    var lbl = $("#liveryLabel");
    if (lbl) lbl.textContent = LIVERY_LABELS[v];
    var swatches = document.querySelectorAll(".swatch");
    for (var i = 0; i < swatches.length; i++) {
      swatches[i].setAttribute("aria-pressed", swatches[i].dataset.livery === v ? "true" : "false");
    }
  }

  function applyPlain(on) {
    document.documentElement.classList.toggle("plain", !!on);
    try { localStorage.setItem(LS_PLAIN, on ? "1" : "0"); } catch (e) {}
    var btn = $("#plainToggle");
    if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  /* ---------------- rendering ---------------- */
  function buildNav() {
    var nav = $("#siteNav");
    if (!nav) return;
    nav.innerHTML = "";
    DATA.nav.forEach(function (item) {
      var a = el("a", "navlink", item.label);
      a.href = "#/" + item.id;
      a.dataset.id = item.id;
      nav.appendChild(a);
    });
  }

  function setActiveNav(id) {
    var links = document.querySelectorAll(".navlink");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("active", links[i].dataset.id === id);
    }
  }

  function findPage(id) {
    for (var i = 0; i < DATA.pages.length; i++) {
      if (DATA.pages[i].id === id) return DATA.pages[i];
    }
    return null;
  }

  function renderPage(id) {
    var page = findPage(id) || DATA.pages[0];
    var main = $("#pageBody");
    if (!main) return;
    main.innerHTML = "";
    if (page.eyebrow) main.appendChild(el("p", "eyebrow", page.eyebrow));
    main.appendChild(el("h1", "pagetitle", page.title));
    var body = el("div", "pagecontent");
    body.innerHTML = page.content;
    main.appendChild(body);
    setActiveNav(page.id);
    document.title = page.title + " — " + DATA.meta.title;
    window.scrollTo(0, 0);
  }

  /* ---------------- copy as text ---------------- */
  function buildSummaryText() {
    var lines = [DATA.meta.title, ""];
    DATA.pages.forEach(function (p) {
      lines.push("— " + p.title + " —");
      var tmp = document.createElement("div");
      tmp.innerHTML = p.content;
      lines.push(tmp.textContent.replace(/\s+/g, " ").trim());
      lines.push("");
    });
    return lines.join("\n");
  }

  function wireCopyButton() {
    var btn = $("#copySummary");
    if (!btn) return;
    btn.dataset.label = btn.textContent;
    btn.addEventListener("click", function () {
      var text = buildSummaryText();
      var done = function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = btn.dataset.label; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
  }

  function wireLiverySwitcher() {
    var wrap = $("#liveryMenu");
    if (!wrap) return;
    wrap.innerHTML = "";
    LIVERIES.forEach(function (name) {
      var b = el("button", "swatch swatch-" + name, "");
      b.type = "button";
      b.dataset.livery = name;
      b.title = LIVERY_LABELS[name];
      b.setAttribute("aria-label", "Switch to " + LIVERY_LABELS[name] + " livery");
      b.addEventListener("click", function () { applyLivery(name); });
      wrap.appendChild(b);
    });
  }

  function wirePlainToggle() {
    var btn = $("#plainToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      applyPlain(!document.documentElement.classList.contains("plain"));
    });
  }

  /* ---------------- boot ---------------- */
  function boot(data) {
    DATA = (data && data.pages && data.pages.length) ? data : PAGES_FALLBACK;

    buildNav();
    wireLiverySwitcher();
    wirePlainToggle();
    wireCopyButton();

    var storedLivery = null, storedPlain = null;
    try { storedLivery = localStorage.getItem(LS_LIVERY); } catch (e) {}
    try { storedPlain = localStorage.getItem(LS_PLAIN); } catch (e) {}
    applyLivery(storedLivery || DEFAULT_LIVERY);
    applyPlain(storedPlain === "1");

    router = new Router({ fallback: DATA.pages[0].id });

    /* Every page gets a registered route. Without this the router falls
       through to the fallback on every hash change and the nav renders
       the same page forever — which is what was wrong with build one. */
    DATA.pages.forEach(function (p) {
      router.add(p.id, renderPage);
    });

    router.start();
  }

  function init() {
    fetch(BASE + "assets/data/pages.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("pages.json " + r.status); return r.json(); })
      .then(boot)
      .catch(function () { boot(PAGES_FALLBACK); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
