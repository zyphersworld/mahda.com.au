#!/usr/bin/env node
/**
 * Import a GEDCOM into graph-living.json, then redact.
 *
 *   node family/scripts/from-gedcom.mjs path/to/export.ged
 *
 * Rules:
 * - Does not invent people. Only INDI records in the file are kept.
 * - A person is living if they have no death/burial event.
 * - Every imported fact is marked soft unless a NOTE on the record
 *   contains the word SOLID (case-insensitive).
 * - Streets, dollar amounts, and SMS-like note bodies are stripped.
 * - After import, run this same script's redact step (automatic).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gedPath = process.argv[2];
if (!gedPath) {
  console.error('Usage: node family/scripts/from-gedcom.mjs <file.ged>');
  process.exit(2);
}

const raw = readFileSync(gedPath, 'utf8').replace(/\r\n/g, '\n');
const lines = raw.split('\n');

function scrub(text) {
  if (!text) return '';
  let s = String(text);
  s = s.replace(/\b\d+\s+\w+\s+(Street|St|Road|Rd|Avenue|Ave)\b/gi, '');
  s = s.replace(/\$[\d,]+/g, '');
  s = s.replace(/\bNDIS\b[\s\S]{0,80}/gi, '');
  return s.replace(/\s+/g, ' ').trim();
}

const indis = {};
const fams = {};
let cur = null;
let tag = null;

for (const line of lines) {
  const m = line.match(/^(\d+)\s+(?:@([^@]+)@\s+)?(\S+)(?:\s+(.*))?$/);
  if (!m) continue;
  const level = Number(m[1]);
  const xref = m[2];
  const tok = m[3];
  const rest = m[4] || '';
  if (level === 0 && tok === 'INDI') {
    cur = { kind: 'indi', id: xref, names: [], events: [], notes: [] };
    indis[xref] = cur;
    continue;
  }
  if (level === 0 && tok === 'FAM') {
    cur = { kind: 'fam', id: xref, husb: null, wife: null, chil: [], notes: [] };
    fams[xref] = cur;
    continue;
  }
  if (!cur) continue;
  if (level === 1) tag = tok;
  if (cur.kind === 'indi') {
    if (tok === 'NAME') cur.names.push(rest);
    if (tok === 'SEX') cur.sex = rest;
    if (['BIRT', 'DEAT', 'BURI'].includes(tok)) {
      cur.events.push({ type: tok, date: '', place: '' });
    }
    if (tok === 'DATE' && cur.events.length) cur.events[cur.events.length - 1].date = rest;
    if (tok === 'PLAC' && cur.events.length) cur.events[cur.events.length - 1].place = rest;
    if (tok === 'NOTE') cur.notes.push(rest);
    if (tok === 'CONC' && tag === 'NOTE') cur.notes[cur.notes.length - 1] += rest;
  }
  if (cur.kind === 'fam') {
    if (tok === 'HUSB') cur.husb = rest.replace(/@/g, '');
    if (tok === 'WIFE') cur.wife = rest.replace(/@/g, '');
    if (tok === 'CHIL') cur.chil.push(rest.replace(/@/g, ''));
  }
}

function yearOf(s) {
  const m = String(s || '').match(/\b(1[6-9]\d{2}|20\d{2})\b/);
  return m ? Number(m[1]) : null;
}
function parseName(n) {
  const m = String(n || '').match(/^(.*?)\/([^/]*)\/?(.*)$/);
  if (!m) return { given: n.replace(/\//g, '').trim(), surname: '' };
  return { given: (m[1] + ' ' + m[3]).replace(/\s+/g, ' ').trim(), surname: m[2].trim() };
}

const people = [];
const idMap = {};
for (const [xref, ind] of Object.entries(indis)) {
  const nm = parseName(ind.names[0] || 'Unknown');
  const birth = ind.events.find((e) => e.type === 'BIRT') || {};
  const death = ind.events.find((e) => e.type === 'DEAT') || {};
  const buri = ind.events.find((e) => e.type === 'BURI') || {};
  const living = !death.date && !buri.date && !death.place;
  const notes = scrub(ind.notes.join(' '));
  const id = 'ged-' + xref.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase();
  idMap[xref] = id;
  people.push({
    id,
    given: nm.given,
    surname: nm.surname,
    display: [nm.given, nm.surname].filter(Boolean).join(' '),
    aka: ind.names.slice(1).map((n) => n.replace(/\//g, ' ').trim()),
    sex: ind.sex === 'F' ? 'F' : ind.sex === 'M' ? 'M' : null,
    living,
    birth: scrub(birth.date) || null,
    birth_year: yearOf(birth.date),
    birth_place: scrub(birth.place) || null,
    death: scrub(death.date) || null,
    death_year: yearOf(death.date),
    death_place: scrub(death.place) || null,
    burial: scrub([buri.date, buri.place].filter(Boolean).join(', ')) || null,
    evidence: /solid/i.test(notes) ? 'solid' : 'soft',
    line: 'gedcom',
    notes,
    sources: [`GEDCOM import: ${gedPath}`],
  });
}

const unions = [];
const edges = [];
for (const fam of Object.values(fams)) {
  const partners = [idMap[fam.husb], idMap[fam.wife]].filter(Boolean);
  if (!partners.length) continue;
  const uid = 'u-' + partners.slice().sort().join('-');
  unions.push({
    id: uid,
    partners,
    type: 'union',
    evidence: 'soft',
    when: null,
    place: null,
    notes: '',
  });
  for (const cid of fam.chil) {
    const child = idMap[cid];
    if (!child) continue;
    edges.push({ type: 'child', from: uid, to: child, evidence: 'soft' });
    for (const p of partners) {
      edges.push({ type: 'parent', from: p, to: child, evidence: 'soft' });
    }
  }
}

const living = {
  meta: {
    title: 'Greene–Hoy family tree',
    updated: new Date().toISOString().slice(0, 10),
    people: people.length,
    living: people.filter((p) => p.living).length,
    deceased: people.filter((p) => !p.living).length,
    solid: people.filter((p) => p.evidence === 'solid').length,
    soft: people.filter((p) => p.evidence !== 'solid').length,
    unions: unions.length,
    edges: edges.length,
    redacted: false,
    focus: people[0] ? people[0].id : null,
    lines: [
      { id: 'gedcom', label: 'GEDCOM import', evidence: 'soft', note: `Imported from ${gedPath}` },
    ],
    unlock: { needed: true, hint: 'Family passphrase unlocks living names for this browser session.' },
  },
  people,
  unions,
  edges,
};

writeFileSync(join(root, 'graph-living.json'), JSON.stringify(living, null, 2) + '\n');
const red = spawnSync(process.execPath, [join(root, 'scripts', 'redact.mjs')], { stdio: 'inherit' });
process.exit(red.status || 0);
