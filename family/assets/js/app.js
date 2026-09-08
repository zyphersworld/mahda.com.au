/* Interactive Three.js Greene–Hoy explorer. Static Pages pack under /family/. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const LIVERIES = [
  { id: 'vellum',  label: 'Vellum',  swatch: '#efe7d4' },
  { id: 'brass',   label: 'Brass',   swatch: '#d9a441' },
  { id: 'iron',    label: 'Iron',    swatch: '#3a4148' },
  { id: 'emerald', label: 'Emerald', swatch: '#2f5340' },
  { id: 'sanctum', label: 'Sanctum', swatch: '#3a3468' },
  { id: 'sigil',   label: 'Sigil',   swatch: '#d4358f' }
];
const DEFAULT_LIVERY = 'iron';
const LIVERY_KEY = 'family.livery';
const UNLOCK_KEY = 'family.livingUnlocked';
const PUBLIC_GRAPH = 'graph.json';
const LIVING_GRAPH = 'graph-living.json';
/* SHA-256 of the exact passphrase "bluey" */
const PASS_HASH = '46b6312339466d3b206325f6f402e1fae56cd65f117c779e3b9259833ffbcdf0';

const VERDICT_HEX = {
  supported: 0x3f9b5a,
  open: 0xd79a4a,
  living: 0x5ec8c0,
  gedcom: 0x6f8fae,
  trap: 0xd4358f
};

const state = {
  data: null,
  unlocked: false,
  view: 'tree',
  selectedId: null,
  query: '',
  verdict: '',
  kind: '',
  scene: null,
  camera: null,
  renderer: null,
  labelRenderer: null,
  controls: null,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
  nodeMeshes: new Map(),
  edgeLines: [],
  labels: [],
  dragging: false,
  pointerDown: null
};

function $(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function storeGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function storeSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* private */ } }
function storeDel(k) { try { sessionStorage.removeItem(k); } catch { /* private */ } }
function liveryGet() { try { return localStorage.getItem(LIVERY_KEY); } catch { return null; } }
function liverySet(v) { try { localStorage.setItem(LIVERY_KEY, v); } catch { /* private */ } }

async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function applyLivery(id, animate) {
  if (!LIVERIES.some((l) => l.id === id)) id = DEFAULT_LIVERY;
  const fade = document.querySelector('.theme-fade');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const set = () => {
    document.documentElement.setAttribute('data-theme', id);
    liverySet(id);
    document.querySelectorAll('.liveries button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.livery === id));
    });
    paintSceneBackground();
  };
  if (animate && fade && !reduce) {
    fade.classList.add('on');
    setTimeout(() => { set(); setTimeout(() => fade.classList.remove('on'), 20); }, 150);
  } else set();
}

function buildLiveries() {
  const host = $('liveries');
  if (!host) return;
  LIVERIES.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.livery = l.id;
    b.title = l.label;
    b.setAttribute('aria-label', 'Livery: ' + l.label);
    b.style.setProperty('--swatch', l.swatch);
    b.addEventListener('click', () => applyLivery(l.id, true));
    host.appendChild(b);
  });
}

function cssHex(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = raw;
  const hex = c.fillStyle;
  if (hex.charAt(0) !== '#') return fallback;
  return parseInt(hex.slice(1), 16);
}

function paintSceneBackground() {
  if (!state.scene || !state.renderer) return;
  const bg = cssHex('--bg', 0x16181a);
  state.scene.background = new THREE.Color(bg);
  state.renderer.setClearColor(bg, 1);
}

function personName(p) {
  if (!p) return 'Unknown';
  if (p.status === 'living' && p.redacted) return 'Living';
  return p.name || p.display || [p.given, p.surname].filter(Boolean).join(' ') || p.id;
}

function personVerdict(p) {
  if (p.verdict) return p.verdict;
  if (p.status === 'living' || p.living) return 'living';
  if (p.evidence === 'solid') return 'supported';
  if (p.evidence === 'soft') return 'open';
  return 'open';
}

function edgeVerdict(e) {
  return e.verdict || (e.evidence === 'solid' ? 'supported' : 'open');
}

function isLiving(p) {
  return p.status === 'living' || p.living === true;
}

function normalizeGraph(raw) {
  const people = (raw.people || []).map((p) => {
    const living = isLiving(p);
    return {
      id: p.id,
      name: p.name || p.display || [p.given, p.surname].filter(Boolean).join(' ') || p.id,
      status: living ? 'living' : (p.status || 'deceased'),
      aka: p.aka || [],
      sex: p.sex || null,
      birth: p.birth || p.birth_year || null,
      death: p.death || p.death_year || null,
      verdict: personVerdict({ ...p, living }),
      notes: p.notes || '',
      sources: p.sources || [],
      redacted: Boolean(p.redacted || (raw.living_redacted && living)),
      living
    };
  });
  const edges = (raw.edges || []).map((e) => ({
    from: e.from,
    to: e.to,
    kind: e.kind || e.type || 'parent',
    verdict: edgeVerdict(e)
  })).filter((e) => e.kind !== 'child' || people.some((p) => p.id === e.to));
  return {
    version: raw.version || 1,
    title: raw.title || 'Greene–Hoy family tree',
    updated: raw.updated,
    living_redacted: Boolean(raw.living_redacted),
    living_visible: Boolean(raw.living_visible),
    placeholder: Boolean(raw.placeholder) || people.length === 0,
    note: raw.note || '',
    people,
    edges
  };
}

function setLockUi() {
  const pill = $('lock-pill');
  const msg = $('unlock-msg');
  const lockBtn = $('lock-btn');
  if (state.unlocked) {
    if (pill) { pill.textContent = 'Living unlocked'; pill.className = 'pill ok'; }
    if (msg) { msg.textContent = 'Living names visible for this session.'; msg.className = 'hint ok'; }
    if (lockBtn) lockBtn.hidden = false;
  } else {
    if (pill) { pill.textContent = 'Living redacted'; pill.className = 'pill'; }
    if (msg) { msg.textContent = 'Living stay redacted until the family passphrase unlocks this session.'; msg.className = 'hint'; }
    if (lockBtn) lockBtn.hidden = true;
  }
}

async function loadGraph(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error('Could not load ' + url + ' (' + r.status + ')');
  return normalizeGraph(await r.json());
}

function applyData(g) {
  state.data = g;
  if (!g.people.some((p) => p.id === state.selectedId)) state.selectedId = null;
  $('docket-count').textContent = String(g.people.length);
  const flag = $('placeholder-flag');
  if (flag) flag.hidden = !g.placeholder;
  const empty = $('empty-banner');
  if (empty) empty.hidden = g.people.length > 0;
  rebuildScene();
  renderSideViews();
}

async function tryUnlock(pass) {
  const hex = await sha256hex(String(pass || ''));
  if (hex !== PASS_HASH) {
    const msg = $('unlock-msg');
    if (msg) { msg.textContent = 'That passphrase did not unlock living names.'; msg.className = 'hint bad'; }
    return;
  }
  storeSet(UNLOCK_KEY, '1');
  state.unlocked = true;
  setLockUi();
  applyData(await loadGraph(LIVING_GRAPH));
}

async function lockAgain() {
  storeDel(UNLOCK_KEY);
  state.unlocked = false;
  setLockUi();
  const pass = $('pass');
  if (pass) pass.value = '';
  applyData(await loadGraph(PUBLIC_GRAPH));
}

function visiblePerson(p) {
  if (state.verdict && p.verdict !== state.verdict) return false;
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  const blob = [p.name, p.id, p.status, p.verdict].concat(p.aka).join(' ').toLowerCase();
  return blob.includes(q);
}

function visibleEdge(e, keep) {
  if (state.kind && e.kind !== state.kind) return false;
  if (state.verdict && e.verdict !== state.verdict) return false;
  return keep.has(e.from) && keep.has(e.to);
}

function layoutPeople(people) {
  /* Generation-ish layout from parent edges; works for 0–hundreds. */
  const byId = new Map(people.map((p) => [p.id, p]));
  const children = new Map();
  const parents = new Map();
  (state.data.edges || []).forEach((e) => {
    if (e.kind === 'spouse') return;
    if (!children.has(e.from)) children.set(e.from, []);
    children.get(e.from).push(e.to);
    if (!parents.has(e.to)) parents.set(e.to, []);
    parents.get(e.to).push(e.from);
  });
  const depth = new Map();
  function walk(id, d, seen) {
    if (seen.has(id)) return;
    seen.add(id);
    depth.set(id, Math.min(d, depth.has(id) ? depth.get(id) : d));
    (children.get(id) || []).forEach((cid) => walk(cid, d + 1, seen));
  }
  people.forEach((p) => {
    if (!parents.has(p.id)) walk(p.id, 0, new Set());
  });
  people.forEach((p) => { if (!depth.has(p.id)) depth.set(p.id, 0); });
  const cols = new Map();
  people.forEach((p) => {
    const d = depth.get(p.id);
    if (!cols.has(d)) cols.set(d, []);
    cols.get(d).push(p);
  });
  const pos = new Map();
  const gapX = 4.2, gapY = 2.4;
  [...cols.keys()].sort((a, b) => a - b).forEach((d) => {
    const col = cols.get(d);
    col.forEach((p, i) => {
      const y = (i - (col.length - 1) / 2) * gapY;
      pos.set(p.id, new THREE.Vector3(d * gapX, y, (i % 3 - 1) * 0.55));
    });
  });
  return pos;
}

function clearGraphObjects() {
  state.nodeMeshes.forEach((mesh) => {
    state.scene.remove(mesh);
    mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  });
  state.nodeMeshes.clear();
  state.edgeLines.forEach((ln) => {
    state.scene.remove(ln);
    ln.geometry.dispose();
    if (ln.material) ln.material.dispose();
  });
  state.edgeLines = [];
  state.labels.forEach((lab) => {
    if (lab.parent) lab.parent.remove(lab);
    if (lab.element && lab.element.parentNode) lab.element.parentNode.removeChild(lab.element);
  });
  state.labels = [];
}

function rebuildScene() {
  if (!state.scene || !state.data) return;
  clearGraphObjects();
  const people = state.data.people.filter(visiblePerson);
  const keep = new Set(people.map((p) => p.id));
  const edges = state.data.edges.filter((e) => visibleEdge(e, keep));
  const pos = layoutPeople(people);

  edges.forEach((e) => {
    const a = pos.get(e.from), b = pos.get(e.to);
    if (!a || !b) return;
    const geom = new THREE.BufferGeometry().setFromPoints([a, b]);
    const color = VERDICT_HEX[e.verdict] || VERDICT_HEX.open;
    const soft = e.verdict === 'open' || e.verdict === 'gedcom' || e.kind === 'step';
    const mat = soft
      ? new THREE.LineDashedMaterial({ color, dashSize: 0.22, gapSize: 0.14, linewidth: 1 })
      : new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geom, mat);
    if (soft) line.computeLineDistances();
    line.userData = { edge: e };
    state.scene.add(line);
    state.edgeLines.push(line);
  });

  const geo = new THREE.SphereGeometry(0.38, 24, 18);
  people.forEach((p) => {
    const color = VERDICT_HEX[p.verdict] || VERDICT_HEX.open;
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.42,
      metalness: 0.18,
      emissive: color,
      emissiveIntensity: p.id === state.selectedId ? 0.45 : 0.08
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos.get(p.id) || new THREE.Vector3());
    mesh.userData = { person: p };
    state.scene.add(mesh);
    state.nodeMeshes.set(p.id, mesh);

    const el = document.createElement('div');
    el.className = 'node-label' + (p.living ? ' living' : '') + (p.id === state.selectedId ? ' selected' : '');
    el.textContent = personName(p);
    const lab = new CSS2DObject(el);
    lab.position.set(0, 0.62, 0);
    mesh.add(lab);
    state.labels.push(lab);
  });

  renderCard();
}

function pickPerson(clientX, clientY) {
  const el = $('view');
  const r = el.getBoundingClientRect();
  state.pointer.x = ((clientX - r.left) / r.width) * 2 - 1;
  state.pointer.y = -((clientY - r.top) / r.height) * 2 + 1;
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const hits = state.raycaster.intersectObjects([...state.nodeMeshes.values()], false);
  return hits[0] ? hits[0].object.userData.person : null;
}

function renderCard() {
  const card = $('card');
  if (!card) return;
  const p = state.data && state.data.people.find((x) => x.id === state.selectedId);
  if (!p) { card.hidden = true; return; }
  card.hidden = false;
  $('card-kicker').textContent = (p.verdict || 'open') + ' · ' + (p.status || '');
  $('card-name').textContent = personName(p);
  const rels = [];
  (state.data.edges || []).forEach((e) => {
    if (e.from === p.id || e.to === p.id) {
      const otherId = e.from === p.id ? e.to : e.from;
      const o = state.data.people.find((x) => x.id === otherId);
      if (o) rels.push(e.kind + ' · ' + personName(o));
    }
  });
  $('card-body').innerHTML =
    '<div class="rows">' +
    row('Status', p.status + (p.redacted ? ' (redacted)' : '')) +
    row('Verdict', p.verdict) +
    row('Born', p.birth || '—') +
    row('Died', p.death || (p.living ? 'Living' : '—')) +
    row('Also', p.aka.length ? p.aka.join('; ') : '—') +
    row('Links', rels.length ? rels.join(' · ') : '—') +
    row('Notes', p.notes || '—') +
    '</div>';
}
function row(k, v) {
  return '<div class="row"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div></div>';
}

function renderList() {
  const host = $('list-view');
  if (!host || !state.data) return;
  const rows = state.data.people.filter(visiblePerson).sort((a, b) => personName(a).localeCompare(personName(b)));
  if (!rows.length) {
    host.innerHTML = '<section class="panel"><p class="empty">' +
      (state.data.placeholder
        ? 'Empty graph — the GR export is not in this repo. Nobody was invented to fill it.'
        : 'Nothing matches that filter.') +
      '</p></section>';
    return;
  }
  host.innerHTML = '<section class="panel"><p class="kicker">Index · ' + rows.length + '</p><div class="index">' +
    rows.map((p) => (
      '<button type="button" data-id="' + esc(p.id) + '"><div class="who">' +
      esc(personName(p)) + '</div><div class="meta">' +
      esc(p.verdict + ' · ' + p.status) + '</div></button>'
    )).join('') + '</div></section>';
  host.querySelectorAll('button[data-id]').forEach((b) => {
    b.addEventListener('click', () => {
      state.selectedId = b.getAttribute('data-id');
      setView('tree');
      rebuildScene();
    });
  });
}

function renderAbout() {
  const host = $('about-view');
  if (!host || !state.data) return;
  host.innerHTML =
    '<section class="panel">' +
      '<p class="kicker">Sources</p>' +
      '<h2>Honest empty pack</h2>' +
      '<p>This explorer is the public Three.js viewer (OrbitControls, click-select, Soft≠solid, living unlock). ' +
      'The private GR export (~583 people) is <b>not</b> in this repository, so <code>people</code> and <code>edges</code> are empty arrays.</p>' +
      '<p>Andrea Moon / <code>greene-andrea</code> is not in the graph. No memoir-inferred spouses, no invented Greene kin, and no Hoykin scrape turned into living nodes.</p>' +
      '<p>Hoy historical notes, if any, live only in <code>sources/</code> as text. They are not tree data.</p>' +
      '<p>Unlock uses a SHA-256 check of the family passphrase and keeps the session in <code>sessionStorage</code>. ' +
      'Replace <code>graph.json</code> / <code>graph-living.json</code> with the real export (schema: people[].name/id/status/aka, edges[].from/to/verdict/kind) or run <code>scripts/from-gedcom.mjs</code>.</p>' +
      (state.data.note ? '<p>' + esc(state.data.note) + '</p>' : '') +
    '</section>';
}

function renderSideViews() {
  if (state.view === 'list') renderList();
  else if (state.view === 'about') renderAbout();
  else renderCard();
}

function setView(next) {
  state.view = next;
  $('tree-view').hidden = next !== 'tree';
  $('list-view').hidden = next !== 'list';
  $('about-view').hidden = next !== 'about';
  document.querySelectorAll('.views [data-view]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === next));
  });
  renderSideViews();
  if (next === 'tree') onResize();
}

function initThree() {
  const host = $('view');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
  camera.position.set(8, 4, 14);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.appendChild(renderer.domElement);
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'label-layer';
  host.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2;
  controls.maxDistance = 80;
  controls.target.set(2, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff4dd, 0.85);
  key.position.set(6, 10, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x88aacc, 0.35);
  fill.position.set(-8, 4, -6);
  scene.add(fill);

  const grid = new THREE.GridHelper(80, 40, 0x445055, 0x2a3035);
  grid.position.y = -6;
  scene.add(grid);

  state.scene = scene;
  state.camera = camera;
  state.renderer = renderer;
  state.labelRenderer = labelRenderer;
  state.controls = controls;
  paintSceneBackground();

  renderer.domElement.addEventListener('pointerdown', (ev) => {
    state.pointerDown = { x: ev.clientX, y: ev.clientY };
    state.dragging = false;
  });
  renderer.domElement.addEventListener('pointermove', (ev) => {
    if (!state.pointerDown) return;
    if (Math.hypot(ev.clientX - state.pointerDown.x, ev.clientY - state.pointerDown.y) > 4) {
      state.dragging = true;
    }
  });
  renderer.domElement.addEventListener('pointerup', (ev) => {
    if (!state.dragging) {
      const p = pickPerson(ev.clientX, ev.clientY);
      if (p) {
        state.selectedId = p.id;
        rebuildScene();
      }
    }
    state.pointerDown = null;
    state.dragging = false;
  });

  function tick() {
    requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  tick();
  onResize();
}

function onResize() {
  const host = $('view');
  if (!host || !state.camera) return;
  const w = host.clientWidth || 640;
  const h = host.clientHeight || 420;
  state.camera.aspect = w / h;
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(w, h, false);
  state.labelRenderer.setSize(w, h);
}

async function boot() {
  applyLivery(liveryGet() || DEFAULT_LIVERY, false);
  buildLiveries();
  initThree();
  window.addEventListener('resize', onResize);

  $('unlock-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    tryUnlock($('pass').value);
  });
  $('lock-btn').addEventListener('click', lockAgain);
  $('card-close').addEventListener('click', () => {
    state.selectedId = null;
    rebuildScene();
  });
  $('q').addEventListener('input', (ev) => {
    state.query = ev.target.value;
    if (state.view === 'tree') rebuildScene();
    else renderSideViews();
  });
  $('verdict').addEventListener('change', (ev) => {
    state.verdict = ev.target.value;
    if (state.view === 'tree') rebuildScene();
    else renderSideViews();
  });
  $('kind').addEventListener('change', (ev) => {
    state.kind = ev.target.value;
    if (state.view === 'tree') rebuildScene();
    else renderSideViews();
  });
  document.querySelectorAll('.views [data-view]').forEach((b) => {
    b.addEventListener('click', () => setView(b.getAttribute('data-view')));
  });

  state.unlocked = storeGet(UNLOCK_KEY) === '1';
  setLockUi();
  try {
    applyData(await loadGraph(state.unlocked ? LIVING_GRAPH : PUBLIC_GRAPH));
  } catch (err) {
    $('view').insertAdjacentHTML('afterbegin',
      '<div class="empty-banner"><p class="kicker">Load failed</p><p>' + esc(err.message) +
      '. Serve /family/ over http.</p></div>');
  }
}

boot();
