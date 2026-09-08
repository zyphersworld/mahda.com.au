#!/usr/bin/env node
/**
 * Build graph.json (living redacted) from graph-living.json (GR export schema).
 * Living people keep their node and become name "Living".
 * Streets / sealed housing fields are never copied.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const livingPath = join(root, "graph-living.json");
const publicPath = join(root, "graph.json");
const aliasPath = join(root, "graph.public.json");

const ALLOWED_PERSON = [
  "id",
  "name",
  "aka",
  "status",
  "verdict",
  "generation",
  "born",
  "died",
  "notes",
  "sources",
];
const FORBIDDEN = /street|ndis|sms|koroit|housing|sealed/i;

function scrub(value) {
  if (typeof value === "string" && FORBIDDEN.test(value)) return "";
  if (Array.isArray(value)) return value.map(scrub).filter(Boolean);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN.test(k)) continue;
      const next = scrub(v);
      if (next !== "" && next != null) out[k] = next;
    }
    return out;
  }
  return value;
}

function publicPerson(p) {
  const living = p.status === "living" || p.living === true;
  const out = {};
  for (const key of ALLOWED_PERSON) {
    if (p[key] == null) continue;
    out[key] = scrub(p[key]);
  }
  if (living) {
    out.name = "Living";
    out.status = "living";
    delete out.aka;
    delete out.born;
  }
  return out;
}

const src = JSON.parse(readFileSync(livingPath, "utf8"));
const out = {
  version: src.version ?? 1,
  living_redacted: true,
  living_visible: false,
  placeholder: src.placeholder === true,
  people: (src.people || []).map(publicPerson),
  edges: (src.edges || []).map((e) => ({
    from: e.from,
    to: e.to,
    kind: e.kind || "child",
    verdict: e.verdict || "unknown",
  })),
};

writeFileSync(publicPath, JSON.stringify(out, null, 2) + "\n");
writeFileSync(aliasPath, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${out.people.length} public people, ${out.edges.length} edges.`);
