#!/usr/bin/env node
/** Rebuild graph.json + graph.public.json from graph-living.json. */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const living = JSON.parse(readFileSync(join(root, 'graph-living.json'), 'utf8'));

function redactPerson(p) {
  if (!p.living) return { ...p, redacted: false };
  return {
    ...p,
    display: 'Living',
    given: 'Living',
    surname: '',
    aka: [],
    birth: null,
    birth_year: null,
    birth_place: null,
    notes: 'Living person — name withheld until unlock.',
    redacted: true,
  };
}

const pub = {
  ...living,
  meta: { ...living.meta, redacted: true },
  people: living.people.map(redactPerson),
};
const txt = JSON.stringify(pub, null, 2) + '\n';
writeFileSync(join(root, 'graph.public.json'), txt);
writeFileSync(join(root, 'graph.json'), txt);
console.log('redacted', pub.people.filter((p) => p.redacted).length, 'living people');
