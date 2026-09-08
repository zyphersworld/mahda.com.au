/* Greene–Hoy public tree. Static GitHub Pages pack under /family/. */
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
  var LIVERY_KEY = 'family.livery';
  var UNLOCK_KEY = 'family.livingUnlocked';
  var PASSPHRASE = 'bluey';
  var PUBLIC_GRAPH = 'graph.json';
  var LIVING_GRAPH = 'graph-living.json';

  var data = null;
  var unlocked = false;
  var view = 'tree';
  var selectedId = null;
  var lineFilter = '';
  var query = '';
  var cam = { x: 0, y: 0, s: 1 };
  var drag = null;
  var layout = { nodes: [], hits: [] };

  function byId(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }
  function storeGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private */ } }
  function storeDel(k) { try { sessionStorage.removeItem(k); } catch (e) { /* private */ } }
  function liveryGet() { try { return localStorage.getItem(LIVERY_KEY); } catch (e) { return null; } }
  function liverySet(v) { try { localStorage.setItem(LIVERY_KEY, v); } catch (e) { /* private */ } }

  function applyLivery(id, animate) {
    if (!LIVERIES.some(function (l) { return l.id === id; })) id = DEFAULT_LIVERY;
    var fade = document.querySelector('.theme-fade');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function set() {
      document.documentElement.setAttribute('data-theme', id);
      liverySet(id);
      Array.prototype.forEach.call(document.querySelectorAll('.liveries button'), function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.livery === id));
      });
      draw();
    }
    if (animate && fade && !reduce) {
      fade.classList.add('on');
      window.setTimeout(function () {
        set();
        window.setTimeout(function () { fade.classList.remove('on'); }, 20);
      }, 160);
    } else set();
  }

  function buildLiveries() {
    var host = byId('liveries');
    if (!host) return;
    LIVERIES.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.livery = l.id;
      b.title = l.label;
      b.setAttribute('aria-label', 'Livery: ' + l.label);
      b.style.setProperty('--swatch', l.swatch);
      b.addEventListener('click', function () { applyLivery(l.id, true); });
      host.appendChild(b);
    });
  }

  function personMap() {
    var m = {};
    (data.people || []).forEach(function (p) { m[p.id] = p; });
    return m;
  }
  function unionMap() {
    var m = {};
    (data.unions || []).forEach(function (u) { m[u.id] = u; });
    return m;
  }
  function parentsOf(id) {
    var out = [];
    (data.edges || []).forEach(function (e) {
      if ((e.type === 'parent' || e.type === 'step-parent') && e.to === id) out.push(e);
    });
    return out;
  }
  function childrenOf(id) {
    var out = [];
    (data.edges || []).forEach(function (e) {
      if ((e.type === 'parent' || e.type === 'step-parent') && e.from === id) out.push(e);
    });
    return out;
  }
  function unionsOf(id) {
    return (data.unions || []).filter(function (u) {
      return u.partners.indexOf(id) !== -1;
    });
  }
  function displayName(p) {
    return (p && p.display) || 'Unknown';
  }
  function yearsOf(p) {
    if (!p) return '';
    if (p.living && p.redacted) return 'living';
    var a = p.birth_year || '';
    var b = p.death_year || (p.living ? '' : '');
    if (a && b) return a + '–' + b;
    if (a && p.living) return 'b. ' + a;
    if (a) return 'b. ' + a;
    if (b) return 'd. ' + b;
    return p.living ? 'living' : '';
  }

  function setLockUi() {
    var pill = byId('lock-pill');
    var msg = byId('unlock-msg');
    var lockBtn = byId('lock-btn');
    if (unlocked) {
      if (pill) { pill.textContent = 'Living unlocked'; pill.className = 'pill ok'; }
      if (msg) { msg.textContent = 'Living names are visible in this session only.'; msg.className = 'hint ok'; }
      if (lockBtn) lockBtn.hidden = false;
    } else {
      if (pill) { pill.textContent = 'Living redacted'; pill.className = 'pill'; }
      if (msg) { msg.textContent = 'Default view redacts every living name. Unlock lasts for this browser session.'; msg.className = 'hint'; }
      if (lockBtn) lockBtn.hidden = true;
    }
  }

  function loadGraph(url, then) {
    fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(then)
      .catch(function (err) {
        var main = byId('main');
        if (main) {
          main.innerHTML = '<section class="panel"><h2>Tree failed to load</h2><p>' +
            esc(String(err)) + '. Serve <code>family/</code> over http so the JSON can be fetched.</p></section>';
        }
      });
  }

  function applyData(g) {
    data = g;
    if (!selectedId || !g.people.some(function (p) { return p.id === selectedId; })) {
      selectedId = (g.meta && g.meta.focus) || (g.people[0] && g.people[0].id);
    }
    var count = byId('docket-count');
    if (count) count.textContent = String(g.meta && g.meta.people || g.people.length);
    var upd = byId('docket-updated');
    if (upd && g.meta && g.meta.updated) upd.textContent = g.meta.updated;
    var sel = byId('line');
    if (sel && !sel.dataset.ready) {
      (g.meta.lines || []).forEach(function (ln) {
        var o = document.createElement('option');
        o.value = ln.id;
        o.textContent = ln.label;
        sel.appendChild(o);
      });
      sel.dataset.ready = '1';
    }
    render();
  }

  function tryUnlock(pass) {
    var ok = String(pass || '').trim().toLowerCase() === PASSPHRASE;
    var msg = byId('unlock-msg');
    if (!ok) {
      if (msg) { msg.textContent = 'That passphrase did not unlock living names.'; msg.className = 'hint bad'; }
      return;
    }
    storeSet(UNLOCK_KEY, '1');
    unlocked = true;
    setLockUi();
    loadGraph(LIVING_GRAPH, applyData);
  }

  function lockAgain() {
    storeDel(UNLOCK_KEY);
    unlocked = false;
    setLockUi();
    var pass = byId('pass');
    if (pass) pass.value = '';
    loadGraph(PUBLIC_GRAPH, applyData);
  }

  function visiblePeople() {
    var q = query.trim().toLowerCase();
    return (data.people || []).filter(function (p) {
      if (lineFilter && p.line !== lineFilter) return false;
      if (!q) return true;
      var blob = [p.display, p.given, p.surname].concat(p.aka || []).concat(p.notes || '').join(' ').toLowerCase();
      if (p.birth_year) blob += ' ' + p.birth_year;
      if (p.death_year) blob += ' ' + p.death_year;
      return blob.indexOf(q) !== -1;
    });
  }

  function focusSet(id) {
    var people = personMap();
    var keep = {};
    function walkUp(pid, depth) {
      if (!pid || keep[pid] || depth > 5) return;
      keep[pid] = true;
      parentsOf(pid).forEach(function (e) { walkUp(e.from, depth + 1); });
      unionsOf(pid).forEach(function (u) {
        u.partners.forEach(function (sid) { keep[sid] = true; });
      });
    }
    function walkDown(pid, depth) {
      if (!pid || depth > 4) return;
      keep[pid] = true;
      childrenOf(pid).forEach(function (e) {
        keep[e.to] = true;
        walkDown(e.to, depth + 1);
      });
      unionsOf(pid).forEach(function (u) {
        u.partners.forEach(function (sid) { keep[sid] = true; });
      });
    }
    walkUp(id, 0);
    walkDown(id, 0);
    if (lineFilter) {
      Object.keys(keep).forEach(function (pid) {
        var p = people[pid];
        if (p && p.line && p.line !== lineFilter && pid !== id) delete keep[pid];
      });
      keep[id] = true;
    }
    return keep;
  }

  function generationOf(id, people) {
    var seen = {};
    function up(pid, n) {
      if (!pid || seen[pid]) return n;
      seen[pid] = true;
      var pars = parentsOf(pid);
      if (!pars.length) return n;
      var best = n;
      pars.forEach(function (e) {
        var v = up(e.from, n - 1);
        if (v < best) best = v;
      });
      return best;
    }
    return up(id, 0);
  }

  function buildLayout() {
    layout = { nodes: [], hits: [] };
    if (!data || !selectedId) return;
    var people = personMap();
    var keep = focusSet(selectedId);
    var ids = Object.keys(keep).filter(function (id) { return people[id]; });
    if (!ids.length) return;

    var gen = {};
    ids.forEach(function (id) { gen[id] = generationOf(id, people); });
    var minG = Math.min.apply(null, ids.map(function (id) { return gen[id]; }));
    ids.forEach(function (id) { gen[id] -= minG; });

    var cols = {};
    ids.forEach(function (id) {
      var g = gen[id];
      if (!cols[g]) cols[g] = [];
      cols[g].push(id);
    });
    Object.keys(cols).forEach(function (g) {
      cols[g].sort(function (a, b) {
        var pa = people[a], pb = people[b];
        return String(pa.birth_year || 9999) - String(pb.birth_year || 9999) ||
          displayName(pa).localeCompare(displayName(pb));
      });
    });

    var W = 168, H = 58, GAPX = 36, GAPY = 28;
    var nodes = {};
    var maxRow = 0;
    Object.keys(cols).forEach(function (g) {
      var row = cols[g];
      if (row.length > maxRow) maxRow = row.length;
      row.forEach(function (id, i) {
        nodes[id] = {
          id: id,
          x: Number(g) * (W + GAPX),
          y: i * (H + GAPY),
          w: W,
          h: H,
          person: people[id]
        };
      });
    });
    Object.keys(nodes).forEach(function (id) {
      var col = cols[gen[id]] || [];
      var extra = Math.max(0, (maxRow - col.length) * (H + GAPY) / 2);
      nodes[id].y += extra;
    });

    layout.nodes = Object.keys(nodes).map(function (id) { return nodes[id]; });
    layout.hits = layout.nodes;
    layout.links = [];
    (data.edges || []).forEach(function (e) {
      if (e.type === 'child') return;
      if (!nodes[e.from] || !nodes[e.to]) return;
      layout.links.push({
        a: nodes[e.from],
        b: nodes[e.to],
        evidence: e.evidence,
        kind: e.type
      });
    });
    (data.unions || []).forEach(function (u) {
      if (u.partners.length < 2) return;
      var a = nodes[u.partners[0]], b = nodes[u.partners[1]];
      if (!a || !b) return;
      layout.links.push({ a: a, b: b, evidence: u.evidence, kind: 'union' });
    });
  }

  function draw() {
    var canvas = byId('tree');
    if (!canvas || view !== 'tree') return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(320, Math.floor(rect.width * dpr));
    canvas.height = Math.max(240, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var w = rect.width, h = rect.height;
    ctx.fillStyle = cssVar('--panel-2', '#ece2ca');
    ctx.fillRect(0, 0, w, h);

    buildLayout();
    if (!layout.nodes.length) {
      ctx.fillStyle = cssVar('--muted', '#7c705c');
      ctx.font = '16px "IM Fell English", serif';
      ctx.fillText('No people in this view.', 24, 40);
      return;
    }

    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.s, cam.s);

    layout.links.forEach(function (ln) {
      var ax = ln.a.x + ln.a.w / 2, ay = ln.a.y + ln.a.h / 2;
      var bx = ln.b.x + ln.b.w / 2, by = ln.b.y + ln.b.h / 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = ln.kind === 'union' ? cssVar('--accent-2', '#b8863a') : cssVar('--accent', '#8a2b16');
      ctx.lineWidth = ln.kind === 'union' ? 2.2 : 1.6;
      if (ln.evidence === 'soft' || ln.kind === 'step-parent') ctx.setLineDash([5, 4]);
      else ctx.setLineDash([]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    layout.nodes.forEach(function (n) {
      var p = n.person;
      var isSel = p.id === selectedId;
      ctx.fillStyle = isSel ? cssVar('--panel', '#f7f1e2') : cssVar('--bg', '#efe7d4');
      ctx.strokeStyle = isSel ? cssVar('--accent', '#8a2b16') : cssVar('--rule', '#c8b894');
      ctx.lineWidth = isSel ? 2.4 : 1.2;
      if (p.living) ctx.setLineDash([4, 3]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.rect(n.x, n.y, n.w, n.h);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cssVar('--ink', '#241f18');
      ctx.font = '600 13px Cinzel, serif';
      var name = displayName(p);
      if (name.length > 22) name = name.slice(0, 21) + '…';
      ctx.fillText(name, n.x + 10, n.y + 24);
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillStyle = cssVar('--muted', '#7c705c');
      var sub = (p.evidence === 'solid' ? 'SOLID' : 'SOFT') + '  ' + yearsOf(p);
      ctx.fillText(sub, n.x + 10, n.y + 42);
    });
    ctx.restore();
  }

  function canvasPoint(ev) {
    var canvas = byId('tree');
    var r = canvas.getBoundingClientRect();
    var x = (ev.clientX - r.left - cam.x) / cam.s;
    var y = (ev.clientY - r.top - cam.y) / cam.s;
    return { x: x, y: y };
  }
  function hitNode(pt) {
    for (var i = layout.hits.length - 1; i >= 0; i--) {
      var n = layout.hits[i];
      if (pt.x >= n.x && pt.x <= n.x + n.w && pt.y >= n.y && pt.y <= n.y + n.h) return n;
    }
    return null;
  }
  function fitCam() {
    var canvas = byId('tree');
    if (!canvas || !layout.nodes.length) return;
    var r = canvas.getBoundingClientRect();
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    layout.nodes.forEach(function (n) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });
    var pad = 40;
    var bw = maxX - minX + pad * 2;
    var bh = maxY - minY + pad * 2;
    cam.s = Math.min(1.4, Math.max(0.35, Math.min(r.width / bw, r.height / bh)));
    cam.x = (r.width - (minX + maxX) * cam.s) / 2;
    cam.y = (r.height - (minY + maxY) * cam.s) / 2;
    draw();
  }

  function bindCanvas() {
    var canvas = byId('tree');
    if (!canvas || canvas.dataset.bound) return;
    canvas.dataset.bound = '1';
    canvas.addEventListener('pointerdown', function (ev) {
      canvas.setPointerCapture(ev.pointerId);
      drag = { x: ev.clientX - cam.x, y: ev.clientY - cam.y, moved: false };
    });
    canvas.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      var nx = ev.clientX - drag.x, ny = ev.clientY - drag.y;
      if (Math.abs(nx - cam.x) + Math.abs(ny - cam.y) > 3) drag.moved = true;
      cam.x = nx; cam.y = ny;
      draw();
    });
    canvas.addEventListener('pointerup', function (ev) {
      if (drag && !drag.moved) {
        var n = hitNode(canvasPoint(ev));
        if (n) { selectedId = n.id; render(); }
      }
      drag = null;
    });
    canvas.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var r = canvas.getBoundingClientRect();
      var mx = ev.clientX - r.left, my = ev.clientY - r.top;
      var factor = ev.deltaY > 0 ? 0.92 : 1.08;
      var ns = Math.min(2.4, Math.max(0.28, cam.s * factor));
      cam.x = mx - (mx - cam.x) * (ns / cam.s);
      cam.y = my - (my - cam.y) * (ns / cam.s);
      cam.s = ns;
      draw();
    }, { passive: false });
    byId('zoom-in').addEventListener('click', function () { cam.s = Math.min(2.4, cam.s * 1.15); draw(); });
    byId('zoom-out').addEventListener('click', function () { cam.s = Math.max(0.28, cam.s / 1.15); draw(); });
    byId('zoom-fit').addEventListener('click', fitCam);
    window.addEventListener('resize', draw);
  }

  function renderCard() {
    var card = byId('card');
    if (!card || !data) return;
    var p = (data.people || []).find(function (x) { return x.id === selectedId; });
    if (!p) { card.hidden = true; return; }
    card.hidden = false;
    byId('card-kicker').textContent = (p.line || 'person') + ' · ' + (p.evidence || 'soft');
    byId('card-name').textContent = displayName(p);
    var people = personMap();
    var rels = [];
    parentsOf(p.id).forEach(function (e) {
      var q = people[e.from];
      if (q) rels.push((e.type === 'step-parent' ? 'Step-parent' : 'Parent') + ': ' + displayName(q));
    });
    unionsOf(p.id).forEach(function (u) {
      u.partners.forEach(function (sid) {
        if (sid !== p.id && people[sid]) rels.push('Partner: ' + displayName(people[sid]));
      });
    });
    childrenOf(p.id).forEach(function (e) {
      var q = people[e.to];
      if (q) rels.push((e.type === 'step-parent' ? 'Step-child' : 'Child') + ': ' + displayName(q));
    });
    var body = '<div class="rows">' +
      row('Years', yearsOf(p) || '—') +
      row('Born', [p.birth, p.birth_place].filter(Boolean).join(' · ') || '—') +
      row('Died', [p.death, p.death_place].filter(Boolean).join(' · ') || (p.living ? 'Living' : '—')) +
      row('Burial', p.burial || '—') +
      row('Also', (p.aka && p.aka.length) ? p.aka.join('; ') : '—') +
      row('Evidence', p.evidence === 'solid' ? 'Solid' : 'Soft') +
      row('Relations', rels.length ? rels.join(' · ') : '—') +
      row('Notes', p.notes || '—') +
      row('Sources', (p.sources && p.sources.length) ? p.sources.join(' ') : '—') +
      '</div>' +
      '<p><span class="chip ' + (p.evidence === 'solid' ? 'solid' : 'soft') + '">' +
      (p.evidence === 'solid' ? 'solid' : 'soft ≠ solid') + '</span>' +
      (p.living ? '<span class="chip">living</span>' : '<span class="chip">deceased</span>') + '</p>';
    byId('card-body').innerHTML = body;
  }
  function row(k, v) {
    return '<div class="row"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div></div>';
  }

  function renderList() {
    var host = byId('list-view');
    if (!host) return;
    var rows = visiblePeople().slice().sort(function (a, b) {
      return displayName(a).localeCompare(displayName(b));
    });
    if (!rows.length) {
      host.innerHTML = '<section class="panel"><p class="empty">Nothing matches that filter.</p></section>';
      return;
    }
    host.innerHTML = '<section class="panel"><p class="kicker">Index · ' + rows.length + '</p><div class="index">' +
      rows.map(function (p) {
        return '<button type="button" data-id="' + esc(p.id) + '"><div class="who">' +
          esc(displayName(p)) + '</div><div class="meta">' +
          esc((p.evidence || 'soft') + ' · ' + (yearsOf(p) || 'undated') + ' · ' + (p.line || '')) +
          '</div></button>';
      }).join('') + '</div></section>';
    host.querySelectorAll('button[data-id]').forEach(function (b) {
      b.addEventListener('click', function () {
        selectedId = b.getAttribute('data-id');
        setView('tree');
      });
    });
  }

  function renderAbout() {
    var host = byId('about-view');
    if (!host || !data) return;
    var m = data.meta || {};
    var lines = (m.lines || []).map(function (ln) {
      return '<div class="row"><div class="k">' + esc(ln.label) + '</div><div class="v">' +
        esc(ln.note) + ' (' + esc(ln.evidence) + ')</div></div>';
    }).join('');
    host.innerHTML =
      '<section class="panel">' +
        '<p class="kicker">Sources</p>' +
        '<h2>What this pack holds</h2>' +
        '<p>' + (m.people || 0) + ' people · ' + (m.deceased || 0) + ' deceased · ' +
        (m.living || 0) + ' living · ' + (m.solid || 0) + ' solid · ' + (m.soft || 0) + ' soft.</p>' +
        '<div class="rows">' + lines + '</div>' +
        '<p>No invented people, and no invented register numbers. The Yangery Green register ' +
        'is not joined to the living Greene household — that link is not in the sources we hold.</p>' +
        '<p>Living names stay <i>Living</i> until the family passphrase unlocks this session. ' +
        'This is a static Pages site: the unlocked file is still a public asset if someone fetches it directly. The control is a courtesy gate, not a lock.</p>' +
        '<p>See <a href="README.md">README.md</a> to regenerate from a GEDCOM or to replace the scaffold with a fuller export.</p>' +
      '</section>';
  }

  function setView(next) {
    view = next;
    byId('tree-view').hidden = view !== 'tree';
    byId('list-view').hidden = view !== 'list';
    byId('about-view').hidden = view !== 'about';
    document.querySelectorAll('.views [data-view]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view));
    });
    render();
  }

  function render() {
    if (!data) return;
    if (view === 'tree') {
      renderCard();
      draw();
      window.requestAnimationFrame(function () {
        if (!layout.nodes.length) return;
        if (cam.s === 1 && cam.x === 0 && cam.y === 0) fitCam();
        else draw();
      });
    } else if (view === 'list') {
      renderList();
    } else {
      renderAbout();
    }
  }

  function boot() {
    applyLivery(liveryGet() || DEFAULT_LIVERY, false);
    buildLiveries();
    bindCanvas();
    setLockUi();

    byId('unlock-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      tryUnlock(byId('pass').value);
    });
    byId('lock-btn').addEventListener('click', lockAgain);
    byId('q').addEventListener('input', function (ev) {
      query = ev.target.value;
      if (view === 'list') renderList();
    });
    byId('line').addEventListener('change', function (ev) {
      lineFilter = ev.target.value;
      cam = { x: 0, y: 0, s: 1 };
      render();
    });
    document.querySelectorAll('.views [data-view]').forEach(function (b) {
      b.addEventListener('click', function () { setView(b.getAttribute('data-view')); });
    });

    unlocked = storeGet(UNLOCK_KEY) === '1';
    setLockUi();
    loadGraph(unlocked ? LIVING_GRAPH : PUBLIC_GRAPH, function (g) {
      applyData(g);
      fitCam();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
