// Minimal MediaWiki Action API client for {en,nl,…}.wikipedia.org.
// Polite by construction: identifying User-Agent, maxlag, low concurrency,
// exponential backoff on 429/5xx.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const apiUrl = (wiki) => `https://${wiki}.wikipedia.org/w/api.php`;
// On-disk response cache so an interrupted ingest resumes without re-fetching.
const CACHE = new URL('./.cache/', import.meta.url);
mkdirSync(CACHE, { recursive: true });
const UA =
  'MythGraph/0.1 (educational knowledge graph; https://github.com/arnoldfeenstra-hub/mythographia)';

let active = 0;
const waiting = [];
const MAX_CONCURRENCY = 2;
const MIN_GAP_MS = Number(process.env.WIKI_GAP_MS || 400); // pacing between request starts
const MAX_ATTEMPTS = 9;
let lastStart = 0;

async function slot() {
  if (active >= MAX_CONCURRENCY) await new Promise((r) => waiting.push(r));
  active++;
  const wait = lastStart + MIN_GAP_MS - Date.now();
  lastStart = Math.max(Date.now(), lastStart + MIN_GAP_MS);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}
function release() {
  active--;
  const next = waiting.shift();
  if (next) next();
}

export async function api(params, { attempt = 0, wiki = 'en' } = {}) {
  const body = new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params });
  // English keys stay as they were so existing cache entries remain valid.
  const keySrc = wiki === 'en' ? body.toString() : `${wiki}:${body}`;
  const key = new URL(createHash('sha1').update(keySrc).digest('hex') + '.json', CACHE);
  if (existsSync(key)) return JSON.parse(readFileSync(key, 'utf8'));
  await slot();
  let res;
  try {
    res = await fetch(`${apiUrl(wiki)}?${body}`, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA }, signal: AbortSignal.timeout(60000) });
  } catch (err) {
    release();
    if (attempt < MAX_ATTEMPTS) return retry(params, attempt, err.message, 0, wiki);
    throw err;
  }
  release();
  if (res.status === 429 || res.status >= 500) {
    const after = Number(res.headers.get('retry-after'));
    if (attempt < MAX_ATTEMPTS) return retry(params, attempt, `HTTP ${res.status}`, after > 0 ? after * 1000 : 0, wiki);
    throw new Error(`Wikipedia API ${res.status}`);
  }
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const json = await res.json();
  if (json.error) {
    if (json.error.code === 'maxlag' && attempt < MAX_ATTEMPTS) return retry(params, attempt, 'maxlag', 0, wiki);
    throw new Error(`Wikipedia API error ${json.error.code}: ${json.error.info}`);
  }
  writeFileSync(key, JSON.stringify(json));
  return json;
}

async function retry(params, attempt, why, atLeast = 0, wiki = 'en') {
  const ms = Math.max(atLeast, Math.min(60000, 1500 * 2 ** attempt)) + Math.floor(Math.random() * 500);
  console.warn(`  retrying in ${ms}ms (${why})`);
  await new Promise((r) => setTimeout(r, ms));
  return api(params, { attempt: attempt + 1, wiki });
}

// Runs a query over titles in batches, following `continue` so no page loses
// props. Returns pages keyed by canonical title, plus the normalisation and
// redirect maps so callers can resolve what they asked for.
export async function queryTitles(titles, params, batchSize = 50, wiki = 'en') {
  const pages = new Map();
  const resolved = new Map(); // requested title -> canonical title
  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize);
    let cont = {};
    const alias = new Map(batch.map((t) => [t, t]));
    do {
      const json = await api({ action: 'query', titles: batch.join('|'), redirects: '1', ...params, ...cont }, { wiki });
      const q = json.query || {};
      for (const n of q.normalized || []) for (const [k, v] of alias) if (v === n.from) alias.set(k, n.to);
      for (const r of q.redirects || []) for (const [k, v] of alias) if (v === r.from) alias.set(k, r.to);
      for (const p of q.pages || []) {
        const prev = pages.get(p.title) || {};
        pages.set(p.title, mergePage(prev, p));
      }
      cont = json.continue || null;
    } while (cont);
    for (const [k, v] of alias) resolved.set(k, v);
  }
  return { pages, resolved };
}

function mergePage(a, b) {
  const out = { ...a, ...b };
  for (const key of ['categories', 'images', 'redirects', 'revisions', 'imageinfo', 'langlinks']) {
    if (a[key] || b[key]) out[key] = [...(a[key] || []), ...(b[key] || [])];
  }
  return out;
}

export async function pMap(items, fn, concurrency = 3) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}
