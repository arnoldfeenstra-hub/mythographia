// Wikitext and Commons-metadata parsing. Pure functions, unit-tested in
// test/parse.test.js. Nothing here invents content: every value returned is a
// substring of what Wikipedia or Commons served, or null.

export function normalizeTitle(raw) {
  if (!raw) return null;
  let t = raw.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const hash = t.indexOf('#');
  if (hash === 0) return null; // same-page anchor
  if (hash > 0) t = t.slice(0, hash).trim();
  if (!t) return null;
  if (t.startsWith(':')) t = t.slice(1);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function stripRefs(wikitext) {
  return wikitext
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<ref[^>/]*\/>/gi, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
}

// [[Target]] / [[Target|label]] in article namespace only.
// dropAnchored: skip [[Page#Section|…]] links. In an infobox those point at a
// section (e.g. a list of someone's offspring), not at the person named.
export function extractLinks(wikitext, { dropAnchored = false } = {}) {
  const out = [];
  const re = /\[\[([^\[\]|]+)(?:\|[^\[\]]*)?\]\]/g;
  let m;
  while ((m = re.exec(wikitext))) {
    const target = m[1];
    if (/^\s*:?\s*(file|image|category|wikt|wiktionary|s|q|commons|media|help|wikipedia|wp|template|special|portal|draft|user)\s*:/i.test(target)) continue;
    if (dropAnchored && target.includes('#')) continue;
    const t = normalizeTitle(target);
    if (t) out.push(t);
  }
  return out;
}

export function leadSection(wikitext) {
  const i = wikitext.search(/\n==[^=]/);
  return i === -1 ? wikitext : wikitext.slice(0, i);
}

// Returns the first {{Infobox ...}} as { name, params: {key: rawValue} }.
export function parseInfobox(wikitext) {
  const text = stripRefs(wikitext);
  const start = text.search(/\{\{\s*Infobox[\s_]/i);
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length - 1; i++) {
    if (text[i] === '{' && text[i + 1] === '{') {
      depth++;
      i++;
    } else if (text[i] === '}' && text[i + 1] === '}') {
      depth--;
      i++;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return null;
  const body = text.slice(start + 2, end - 2);
  const parts = splitTopLevel(body);
  const name = parts.shift().trim();
  const params = {};
  for (const p of parts) {
    const eq = p.indexOf('=');
    if (eq === -1) continue;
    const key = p.slice(0, eq).trim().toLowerCase().replace(/\s+/g, '_');
    const value = p.slice(eq + 1).trim();
    if (key && value) params[key] = value;
  }
  return { name, params };
}

function splitTopLevel(body) {
  const parts = [];
  let cur = '';
  let curly = 0;
  let square = 0;
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === '{{') { curly++; cur += two; i++; continue; }
    if (two === '}}') { curly--; cur += two; i++; continue; }
    if (two === '[[') { square++; cur += two; i++; continue; }
    if (two === ']]') { square--; cur += two; i++; continue; }
    if (body[i] === '|' && curly === 0 && square === 0) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += body[i];
  }
  parts.push(cur);
  return parts;
}

// Infobox parameter -> relation. `dir` says which way the parent edge points:
// 'in'  = the linked page is the parent of this page
// 'out' = this page is the parent of the linked page
const FAMILY_KEYS = {
  parents: { rel: 'parent', dir: 'in' },
  parent: { rel: 'parent', dir: 'in' },
  father: { rel: 'parent', dir: 'in' },
  mother: { rel: 'parent', dir: 'in' },
  children: { rel: 'parent', dir: 'out' },
  offspring: { rel: 'parent', dir: 'out' },
  issue: { rel: 'parent', dir: 'out' },
  consort: { rel: 'consort', dir: 'out' },
  consorts: { rel: 'consort', dir: 'out' },
  spouse: { rel: 'consort', dir: 'out' },
  spouses: { rel: 'consort', dir: 'out' },
  partner: { rel: 'consort', dir: 'out' },
  significant_other: { rel: 'consort', dir: 'out' },
  siblings: { rel: 'sibling', dir: 'out' },
  sibling: { rel: 'sibling', dir: 'out' },
  brothers: { rel: 'sibling', dir: 'out' },
  sisters: { rel: 'sibling', dir: 'out' },
};

export function familyFromInfobox(infobox) {
  if (!infobox) return [];
  const out = [];
  for (const [key, value] of Object.entries(infobox.params)) {
    const spec = FAMILY_KEYS[key];
    if (!spec) continue;
    for (const target of extractLinks(value, { dropAnchored: true })) out.push({ target, rel: spec.rel, dir: spec.dir, param: key });
  }
  return out;
}

// Image files in order of appearance: infobox image first, then inline files.
export function imageCandidates(wikitext) {
  const text = stripRefs(wikitext);
  const out = [];
  const box = parseInfobox(text);
  if (box) {
    for (const k of ['image', 'image1', 'img']) {
      const v = box.params[k];
      if (v) {
        const m = v.match(/^(?:\[\[)?(?:File|Image):\s*([^|\]]+)/i);
        out.push(normalizeFile(m ? m[1] : v.split('|')[0]));
      }
    }
  }
  const re = /\[\[\s*(?:File|Image)\s*:\s*([^|\]]+)/gi;
  let m;
  while ((m = re.exec(text))) out.push(normalizeFile(m[1]));
  const gallery = /<gallery[^>]*>([\s\S]*?)<\/gallery>/gi;
  while ((m = gallery.exec(text))) {
    for (const line of m[1].split('\n')) {
      const f = line.split('|')[0].replace(/^\s*(File|Image)\s*:/i, '').trim();
      if (f) out.push(normalizeFile(f));
    }
  }
  return [...new Set(out.filter((f) => f && /\.(jpe?g|png|tiff?|webp)$/i.test(f)))];
}

function normalizeFile(name) {
  const t = normalizeTitle(name);
  return t ? `File:${t}` : null;
}

export function stripHtml(html) {
  if (!html) return null;
  const text = String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

// Public domain or CC0 only. Anything else (including missing metadata) is out.
export function isPublicDomain(extmetadata) {
  if (!extmetadata) return false;
  const license = (extmetadata.License?.value || '').toLowerCase();
  const short = (extmetadata.LicenseShortName?.value || '').toLowerCase();
  if (license === 'pd' || license.startsWith('pd-') || license === 'cc0') return true;
  return /^(public domain|pd\b|pd-|cc0)/.test(short);
}

export function imageRecord(page) {
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const md = info.extmetadata || {};
  if (!isPublicDomain(md)) return null;
  return {
    file_title: page.title,
    thumb_url: info.thumburl || info.url,
    thumb_width: info.thumbwidth || info.width,
    thumb_height: info.thumbheight || info.height,
    original_url: info.url,
    commons_url: info.descriptionurl,
    artist: truncate(stripHtml(md.Artist?.value), 160),
    date_text: truncate(stripHtml(md.DateTimeOriginal?.value), 80),
    license: stripHtml(md.LicenseShortName?.value) || 'Public domain',
    credit: truncate(stripHtml(md.Credit?.value), 200),
    object_name: truncate(stripHtml(md.ObjectName?.value) || stripHtml(md.ImageDescription?.value), 200),
    width: info.width,
    height: info.height,
  };
}

function truncate(s, n) {
  if (!s) return null;
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

// Plaintext extract with "== Heading ==" markers (exsectionformat=wiki).
export function sections(plaintext) {
  const out = [];
  const re = /^(={2,})\s*(.+?)\s*\1\s*$/gm;
  let last = { heading: null, level: 1, start: 0 };
  let m;
  while ((m = re.exec(plaintext))) {
    out.push({ ...last, text: plaintext.slice(last.start, m.index).trim() });
    last = { heading: m[2], level: m[1].length, start: m.index + m[0].length };
  }
  out.push({ ...last, text: plaintext.slice(last.start).trim() });
  return out.map(({ heading, level, text }) => ({ heading, level, text }));
}

const FACT_SECTIONS = [
  /^etymology$/i,
  /^names?( and etymology)?$/i,
  /^etymology and/i,
  /^epithets?/i,
  /^symbols?/i,
  /^attributes/i,
  /^iconography/i,
  /^cult/i,
  /^worship/i,
  /^legacy/i,
  /^in (art|astronomy|popular culture|the arts)/i,
];

// A "fun fact" is the opening of a named, non-lead section: verbatim sentences
// from the article, attributed to their section. Never paraphrased.
export function pickFunFact(plaintext) {
  if (!plaintext) return null;
  const secs = sections(plaintext).filter((s) => s.heading && s.text.length > 60);
  for (const pattern of FACT_SECTIONS) {
    const s = secs.find((x) => pattern.test(x.heading));
    if (s) {
      const text = firstSentences(s.text, 300);
      if (text) return { text, section: s.heading };
    }
  }
  return null;
}

export function firstSentences(text, maxLen) {
  const para = text.split(/\n+/).find((p) => p.trim().length > 40);
  if (!para) return null;
  const sentences = para.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [para];
  let out = '';
  for (const s of sentences) {
    if (out && (out + s).length > maxLen) break;
    out += s;
  }
  out = out.trim();
  if (out.length > maxLen) return null; // a single overlong sentence: skip rather than cut
  return out || null;
}

export function slugify(title) {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Type for pages reached by one-hop expansion (not in the curated seed list),
// read off Wikipedia's own short description. Returns null when the
// description does not identify a Greek-myth figure, and the page is skipped.
export function typeFromDescription(desc) {
  if (!desc) return null;
  const d = desc.toLowerCase();
  // Must be a figure *in* the myths. "Ancient Greek poet" (Hesiod, Homer) is a
  // source about the myths, not a node in them.
  if (!/mytholog|mythic|legendary|homeric|trojan|theban|argonaut|\bgods?\b|goddess|deity|nymph|titan|hero(ine)?\b|monster/.test(d)) return null;
  // Set-index pages ("several figures named X") are a name, not a figure.
  if (/several|multiple|various|set of|list of|name of|names of|figures in|characters/.test(d)) return null;
  if (/primordial/.test(d)) return 'primordial';
  if (/\btitan(ess)?s?\b|pre-olympian/.test(d)) return 'titan';
  if (/olympian/.test(d)) return 'olympian';
  if (/monster|creature|serpent|dragon|beast|\bgiants?\b|drakon|hound|\bbull\b|\bboar\b|\blion\b|cyclops|centaur/.test(d)) return 'creature';
  if (/\bgods?\b|goddess|deity|deities|nymph|personification|daimon|spirit/.test(d)) return 'deity';
  if (/\bhero(ine)?\b|warrior|argonaut/.test(d)) return 'hero';
  if (/\bking\b|\bqueen\b|prince(ss)?|\bmortal\b|priest(ess)?|\bseer\b|prophet/.test(d)) return 'mortal';
  // The description names a figure but not what kind: say so, don't guess.
  return 'figure';
}

// ---- fun facts from wikitext --------------------------------------------------
// Same rule as pickFunFact (verbatim opening of a named section), but read from
// the wikitext we already hold, so no per-page request is needed. Only markup
// is converted: links become their visible text, inline-text templates such as
// {{lang|grc|…}} become their text. Any other template would leave a gap, so a
// sentence that contained one is never used.

const GAP = '\u0000';
const TEXT_TEMPLATES = /^(lang|lang-[a-z-]+|transl|transliteration|grc-transl|nowrap|smallcaps|small|em|lang-rtl|script|linktext|nobr|nbsp)$/i;

function replaceTemplates(text) {
  let out = text;
  for (let guard = 0; guard < 20 && out.includes('{{'); guard++) {
    // innermost templates first
    out = out.replace(/\{\{([^{}]*)\}\}/g, (_, inner) => {
      const parts = inner.split('|');
      const name = parts[0].trim();
      if (/^nbsp$/i.test(name)) return ' ';
      if (TEXT_TEMPLATES.test(name)) {
        const positional = parts.slice(1).filter((p) => !/^\s*[a-z_0-9-]+\s*=/i.test(p));
        const last = positional.at(-1);
        return last != null ? last.trim() : GAP;
      }
      return GAP;
    });
  }
  return out;
}

export function wikitextToPlain(text) {
  let t = stripRefs(text);
  t = t.replace(/\{\|[\s\S]*?\|\}/g, '\n'); // tables
  t = t.split('\n').filter((l) => !/^\s*\[\[\s*(file|image)\s*:/i.test(l)).join('\n');
  t = t.replace(/<gallery[\s\S]*?<\/gallery>/gi, '');
  t = replaceTemplates(t);
  // a line that was only templates (hatnotes, infobox remnants) is not prose
  t = t.split('\n').filter((l) => l.replace(new RegExp(GAP, 'g'), '').trim() !== '' || !l.includes(GAP)).join('\n');
  t = t.replace(/\[\[(?:[^\[\]|]*\|)?([^\[\]]*)\]\]/g, '$1');
  t = t.replace(/\[https?:[^\s\]]+\s([^\]]*)\]/g, '$1');
  t = t.replace(/'{2,}/g, '');
  t = t.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—');
  return t;
}

function balanced(s) {
  let p = 0;
  for (const c of s) {
    if (c === '(') p++;
    else if (c === ')') p--;
    if (p < 0) return false;
  }
  return p === 0 && (s.match(/"/g) || []).length % 2 === 0;
}

function sectionBodies(wikitext) {
  const out = [];
  const re = /^(={2,4})\s*(.+?)\s*\1\s*$/gm;
  const heads = [];
  let m;
  while ((m = re.exec(wikitext))) heads.push({ heading: m[2].replace(/'{2,}/g, '').trim(), start: m.index + m[0].length, at: m.index });
  heads.forEach((h, i) => out.push({ heading: h.heading, body: wikitext.slice(h.start, heads[i + 1]?.at ?? wikitext.length) }));
  return out;
}

// Dutch Wikipedia's section names for the same kinds of section.
const FACT_SECTIONS_NL = [
  /^etymologie/i,
  /^naam( en etymologie)?$/i,
  /^namen$/i,
  /^(epitheta|bijnamen|epitheton)/i,
  /^symbo/i,
  /^attributen/i,
  /^iconografie/i,
  /^(cultus|verering|eredienst)/i,
  /^(nalatenschap|nawerking|receptie)/i,
  /^in de (kunst|beeldende kunst|populaire cultuur|cultuur)/i,
];
const OPENING_PRONOUN = {
  en: /^(it|its|this|these|those|he|she|they|his|her|their|him|them)\b/i,
  nl: /^(dit|deze|hij|zij|ze|hun|zijn|haar|hem)\b/i,
};

export function funFactFromWikitext(wikitext, maxLen = 300, lang = 'en') {
  if (!wikitext) return null;
  const secs = sectionBodies(wikitext);
  for (const pattern of lang === 'nl' ? FACT_SECTIONS_NL : FACT_SECTIONS) {
    for (const s of secs.filter((x) => pattern.test(x.heading))) {
      const plain = wikitextToPlain(s.body);
      const paras = plain.split(/\n\s*\n|\n(?=[*#:;|])/).map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.length > 60 && !/^[*#:;|!{]/.test(p));
      for (const para of paras.slice(0, 1)) {
        if (OPENING_PRONOUN[lang].test(para)) continue;
        const sentences = para.match(/[^.!?]+(?:[.!?]+["”’)]*(?=\s|$)|$)/g) || [];
        let out = '';
        for (const sentence of sentences) {
          if (sentence.includes(GAP) || /\{\{|\}\}|\[\[|\]\]|\|/.test(sentence)) break;
          if ((out + sentence).length > maxLen) break;
          out += sentence;
          if (out.trim().length > 60 && balanced(out)) break;
        }
        out = out.trim();
        if (out.length > 60 && balanced(out) && /[.!?]["”’)]*$/.test(out)) return { text: out, section: s.heading };
      }
    }
  }
  return null;
}
