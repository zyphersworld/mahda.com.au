// build-feed.mjs
// Fetches Google News RSS server-side (no CORS on a CI runner), parses it with
// a tiny dependency-free XML walk, and writes headlines.json next to the page.
// Node 18+ has global fetch built in, so there are no npm dependencies to install.

import { writeFile } from 'node:fs/promises';

// --- the search. Edit the query here to widen or narrow coverage. ---
const QUERY = '"Christian Brothers" (insolvency OR scheme OR moratorium OR survivors OR liquidation OR redress) when:45d';
const RSS_URL = 'https://news.google.com/rss/search?' + new URLSearchParams({
  q: QUERY, hl: 'en-AU', gl: 'AU', ceid: 'AU:en'
}).toString();

const MAX_ITEMS = 12;

// Minimal, robust RSS field extraction. We avoid an XML library on purpose:
// Google News RSS is simple and regex extraction keeps this zero-dependency.
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  if (!m) return '';
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    // Decode entities FIRST, so any encoded markup (e.g. &lt;a href...&gt;)
    // becomes real tags that the strip step below can then remove.
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    // Now strip all tags. Run twice in case decoding exposed nested markup.
    .replace(/<[^>]+>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    // Decode &amp; LAST, so a literal "&amp;lt;" can't re-introduce a "<".
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
function linkOf(block) {
  // <link>url</link> first; fall back to href attribute form used by Atom.
  const a = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (a && a[1].trim()) return a[1].trim();
  const b = block.match(/<link[^>]*href="([^"]+)"/i);
  return b ? b[1] : '';
}

function parse(xml) {
  const items = [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  return items.map(block => {
    let title = tag(block, 'title');
    let src = tag(block, 'source'); // Google News includes a <source> element
    // Google often appends " - Publisher" to the title; split it out if no <source>.
    if (!src) {
      const m = title.match(/\s-\s([^-]+)$/);
      if (m) { src = m[1].trim(); title = title.replace(/\s-\s[^-]+$/, '').trim(); }
    } else {
      title = title.replace(new RegExp(`\\s-\\s${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '').trim();
    }
    let desc = tag(block, 'description');
    // Google appends the publisher to the description text; drop that tail.
    if (src) desc = desc.replace(new RegExp(`\\s*${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`), '').trim();
    // Google News descriptions usually just echo the headline + publisher,
    // which is noise beside the title we already show. Drop them when they
    // add nothing; keep only genuinely different summary text.
    const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const titleKey = norm(title), srcKey = norm(src);
    let descKey = norm(desc);
    if (srcKey) descKey = descKey.split(srcKey).join('');
    if (!desc || descKey.includes(titleKey) || titleKey.includes(descKey) || descKey.length < 25) {
      desc = '';
    } else if (desc.length > 170) {
      desc = desc.slice(0, 167).replace(/\s+\S*$/, '') + '\u2026'; // clamp on a word boundary
    }
    const date = tag(block, 'pubDate');
    return { src: src || 'Google News', t: title, d: desc, date, url: linkOf(block) };
  }).filter(x => x.t && x.url);
}

async function main() {
  let items = [];
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (feed-bot; reckoning-desk)' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const xml = await res.text();
    items = parse(xml).slice(0, MAX_ITEMS);
  } catch (e) {
    console.error('Feed fetch failed:', e.message);
    // Do not overwrite a good file with nothing: exit non-zero so the workflow
    // step fails loudly and the previously committed headlines.json is kept.
    process.exit(1);
  }

  if (!items.length) {
    console.error('Parsed zero items — keeping previous file.');
    process.exit(1);
  }

  const payload = { builtAt: new Date().toISOString(), count: items.length, items };
  await writeFile('reckoning-desk/headlines.json', JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote headlines.json with ${items.length} items.`);
}

main();
