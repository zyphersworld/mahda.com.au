#!/usr/bin/env node
/**
 * Optional: convert a GEDCOM into GR export-shaped graph-living.json.
 * Does not invent people. Empty input → empty graph.
 *
 *   node scripts/from-gedcom.mjs sources/tree.ged
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gedPath = process.argv[2];
const outPath = join(root, "graph-living.json");

if (!gedPath || !existsSync(gedPath)) {
  console.error("Usage: node scripts/from-gedcom.mjs <file.ged>");
  process.exit(1);
}

const text = readFileSync(gedPath, "utf8");
const people = [];
const edges = [];
const byXref = new Map();
let current = null;
let currentFam = null;
const fams = [];

for (const raw of text.split(/\r?\n/)) {
  const line = raw.replace(/\r$/, "");
  const m = line.match(/^(\d+)\s+(@[^@]+@\s+)?(\S+)(?:\s+(.*))?$/);
  if (!m) continue;
  const level = Number(m[1]);
  const xref = m[2] ? m[2].trim() : "";
  const tag = m[3];
  const value = m[4] || "";

  if (level === 0 && tag === "INDI") {
    current = { id: xref.replace(/@/g, ""), name: "", status: "unknown", verdict: "gedcom" };
    currentFam = null;
    people.push(current);
    byXref.set(xref.trim(), current);
  } else if (level === 0 && tag === "FAM") {
    current = null;
    currentFam = { id: xref, husb: null, wife: null, children: [] };
    fams.push(currentFam);
  } else if (current && tag === "NAME" && !current.name) {
    current.name = value.replace(/\//g, "").replace(/\s+/g, " ").trim();
  } else if (current && tag === "DEAT") {
    current.status = "deceased";
  } else if (currentFam && tag === "HUSB") {
    currentFam.husb = value.trim();
  } else if (currentFam && tag === "WIFE") {
    currentFam.wife = value.trim();
  } else if (currentFam && tag === "CHIL") {
    currentFam.children.push(value.trim());
  }
}

function idOf(xref) {
  const p = byXref.get(xref);
  return p ? p.id : null;
}

for (const fam of fams) {
  const parents = [fam.husb, fam.wife].map(idOf).filter(Boolean);
  if (parents.length === 2) {
    edges.push({ from: parents[0], to: parents[1], kind: "spouse", verdict: "gedcom" });
  }
  for (const childX of fam.children) {
    const child = idOf(childX);
    if (!child) continue;
    for (const parent of parents) {
      edges.push({ from: parent, to: child, kind: "child", verdict: "gedcom" });
    }
  }
}

const graph = {
  version: 1,
  living_redacted: false,
  living_visible: true,
  placeholder: people.length === 0,
  people,
  edges,
};

writeFileSync(outPath, JSON.stringify(graph, null, 2) + "\n");
console.log(`Wrote ${people.length} people, ${edges.length} edges to graph-living.json`);
