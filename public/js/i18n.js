// Interface language (English / Dutch).
//
// Two kinds of text, kept strictly apart:
//  * Interface strings (buttons, labels, the footer) live in STRINGS below.
//  * Content (bios, descriptions, fun facts) is never translated here. Dutch
//    content is Dutch Wikipedia's own article, fetched at ingest through the
//    English article's language link. Where there is none, the English text is
//    shown and marked as such.

export const LANGS = ['en', 'nl'];

const STRINGS = {
  en: {
    dek: 'An atlas of Greek myth, drawn from Wikipedia',
    'view.graph': 'Web', 'view.timeline': 'Timeline', 'view.path': 'Six degrees',
    'search.placeholder': 'Find a god, hero, monster…', 'search.label': 'Search',
    'theme.toggle': 'Toggle dark mode', 'lang.toggle': 'Language',
    'status.loading': 'Gathering the myths…',
    'status.unreachable': 'The archive could not be reached.',
    'status.answered': 'The archive answered {status}.',
    'status.empty': 'The archive is empty — run the Wikipedia ingest first.',
    showAll: 'Show all', fewer: 'Fewer', recentre: 'Recentre',
    'legend.title': 'Filter', 'edge.parentage': 'parentage', 'edge.appears': 'appears in', 'edge.linked': 'linked',
    'family.divine': 'Gods', 'family.mortal': 'Mortals', 'family.monster': 'Monsters', 'family.event': 'Events', 'family.other': 'Unclassified',
    'type.primordial': 'Primordial', 'type.titan': 'Titan', 'type.olympian': 'Olympian', 'type.deity': 'Deity',
    'type.hero': 'Hero', 'type.mortal': 'Mortal', 'type.creature': 'Creature', 'type.event': 'Event', 'type.figure': 'Figure',
    'rel.parent.f': 'parent of', 'rel.parent.b': 'child of', 'rel.consort.f': 'consort of', 'rel.consort.b': 'consort of',
    'rel.sibling.f': 'sibling of', 'rel.sibling.b': 'sibling of', 'rel.participant.f': 'appears in', 'rel.participant.b': 'features',
    'rel.associated.f': 'linked with', 'rel.associated.b': 'linked with',
    'group.parents': 'Parents', 'group.children': 'Children', 'group.consorts': 'Consorts', 'group.siblings': 'Siblings',
    'group.appears': 'Appears in', 'group.featuring': 'Featuring', 'group.linked': 'Linked with',
    gen: 'gen', ties: '{n} ties', image: 'image', close: 'Close',
    more: 'Continue reading', factFrom: 'From “{section}”',
    'act.expand': 'Expand in web', 'act.timeline': 'See on timeline', 'act.web': 'Show in web', 'act.from': 'Trace a thread from here',
    source: 'Text: “{link}”, {wiki}{rev}, CC BY-SA 4.0, excerpted without changes.',
    'wiki.en': 'English Wikipedia', 'wiki.nl': 'Dutch Wikipedia', revision: 'revision {n}',
    fallback: '',
    'img.license': 'Public domain',
    'path.title': 'Six degrees of Greek myth',
    'path.hint': 'Pick any two figures. The shortest chain of family ties and shared stories between them is traced across the web.',
    'path.from': 'From', 'path.to': 'To', 'path.fromPh': 'e.g. a god', 'path.toPh': 'e.g. a monster',
    'path.familyOnly': 'Blood and marriage ties only', 'path.go': 'Trace the thread', 'path.random': 'Surprise me',
    'path.choose': 'Choose both figures from the suggestions.',
    'path.none': 'No thread joins them.', 'path.noneFamily': 'No thread joins them through blood or marriage alone.',
    'path.degrees': '{n} degrees of separation.', 'path.degree': '1 degree of separation.',
    'tl.gen0': 'Gen 0', 'tl.axis': 'generations after the first beings →', 'tl.unplaced': 'Unplaced · {n}',
    'tl.now': 'generation {g}', 'tl.label': 'Generation {g} of {max}', 'tl.play': 'Play timeline', 'tl.pause': 'Pause timeline',
    'tl.scrub': 'Scrub through mythic generations',
    stamp: '{nodes} entries · {edges} ties', fetched: 'fetched {date}',
    'foot.sources': 'Sources.',
    'foot.long': 'All text is from {wp} by its contributors, used under {cc} — attribution and share-alike required; every entry links to its article and the exact revision used, and text is excerpted, not altered. Dutch text is from {nlwp}, the Dutch article on the same subject; where none exists the English text is shown. Images are public-domain works from {commons}; artist, date and file page are credited on each card. No content is AI-generated. The timeline’s generations are derived from the parentage recorded in Wikipedia infoboxes — myth has no calendar.',
    'foot.short': 'Text: {wp} contributors, {cc} · Images: {commons}, public domain · nothing AI-generated',
    'wp.name': 'English Wikipedia', 'nlwp.name': 'Dutch Wikipedia', 'wp.short': 'Wikipedia',
  },
  nl: {
    dek: 'Een atlas van de Griekse mythologie, uit Wikipedia',
    'view.graph': 'Web', 'view.timeline': 'Tijdlijn', 'view.path': 'Zes schakels',
    'search.placeholder': 'Zoek een god, held, monster…', 'search.label': 'Zoeken',
    'theme.toggle': 'Donkere modus aan/uit', 'lang.toggle': 'Taal',
    'status.loading': 'De mythen worden verzameld…',
    'status.unreachable': 'Het archief is niet bereikbaar.',
    'status.answered': 'Het archief antwoordde {status}.',
    'status.empty': 'Het archief is leeg — voer eerst de Wikipedia-import uit.',
    showAll: 'Toon alles', fewer: 'Minder', recentre: 'Centreren',
    'legend.title': 'Filter', 'edge.parentage': 'afstamming', 'edge.appears': 'komt voor in', 'edge.linked': 'verbonden',
    'family.divine': 'Goden', 'family.mortal': 'Stervelingen', 'family.monster': 'Monsters', 'family.event': 'Gebeurtenissen', 'family.other': 'Niet ingedeeld',
    'type.primordial': 'Oergod', 'type.titan': 'Titaan', 'type.olympian': 'Olympiër', 'type.deity': 'Godheid',
    'type.hero': 'Held', 'type.mortal': 'Sterveling', 'type.creature': 'Wezen', 'type.event': 'Gebeurtenis', 'type.figure': 'Figuur',
    'rel.parent.f': 'ouder van', 'rel.parent.b': 'kind van', 'rel.consort.f': 'partner van', 'rel.consort.b': 'partner van',
    'rel.sibling.f': 'broer of zus van', 'rel.sibling.b': 'broer of zus van', 'rel.participant.f': 'komt voor in', 'rel.participant.b': 'met',
    'rel.associated.f': 'verbonden met', 'rel.associated.b': 'verbonden met',
    'group.parents': 'Ouders', 'group.children': 'Kinderen', 'group.consorts': 'Partners', 'group.siblings': 'Broers en zussen',
    'group.appears': 'Komt voor in', 'group.featuring': 'Met', 'group.linked': 'Verbonden met',
    gen: 'gen.', ties: '{n} verbanden', image: 'afbeelding', close: 'Sluiten',
    more: 'Verder lezen', factFrom: 'Uit “{section}”',
    'act.expand': 'Uitbreiden in web', 'act.timeline': 'Bekijk op tijdlijn', 'act.web': 'Toon in web', 'act.from': 'Zoek een verband vanaf hier',
    source: 'Tekst: “{link}”, {wiki}{rev}, CC BY-SA 4.0, ongewijzigd overgenomen.',
    'wiki.en': 'Engelstalige Wikipedia', 'wiki.nl': 'Nederlandstalige Wikipedia', revision: 'versie {n}',
    fallback: 'Er is geen Nederlandstalig Wikipedia-artikel over dit onderwerp; hieronder staat de Engelse tekst.',
    'img.license': 'Publiek domein',
    'path.title': 'Zes schakels in de Griekse mythologie',
    'path.hint': 'Kies twee figuren. De kortste keten van familiebanden en gedeelde verhalen tussen hen wordt door het web getrokken.',
    'path.from': 'Van', 'path.to': 'Naar', 'path.fromPh': 'bijv. een god', 'path.toPh': 'bijv. een monster',
    'path.familyOnly': 'Alleen bloed- en huwelijksbanden', 'path.go': 'Zoek het verband', 'path.random': 'Verras me',
    'path.choose': 'Kies beide figuren uit de suggesties.',
    'path.none': 'Er is geen verband tussen hen.', 'path.noneFamily': 'Er is geen verband via alleen bloed- of huwelijksbanden.',
    'path.degrees': '{n} schakels ertussen.', 'path.degree': '1 schakel ertussen.',
    'tl.gen0': 'Gen. 0', 'tl.axis': 'generaties na de eerste wezens →', 'tl.unplaced': 'Niet geplaatst · {n}',
    'tl.now': 'generatie {g}', 'tl.label': 'Generatie {g} van {max}', 'tl.play': 'Tijdlijn afspelen', 'tl.pause': 'Tijdlijn pauzeren',
    'tl.scrub': 'Door de mythische generaties schuiven',
    stamp: '{nodes} items · {edges} verbanden', fetched: 'opgehaald {date}',
    'foot.sources': 'Bronnen.',
    'foot.long': 'Alle Nederlandse tekst komt uit {nlwp}, het Nederlandse artikel over hetzelfde onderwerp; waar dat ontbreekt staat de tekst uit {wp}. Tekst van de bijdragers van Wikipedia, gebruikt onder {cc} — naamsvermelding en gelijk delen verplicht; elk item linkt naar het artikel en de exacte versie, en de tekst is overgenomen, niet bewerkt. Afbeeldingen zijn werken in het publiek domein van {commons}; kunstenaar, datum en bestandspagina staan op elke kaart. Er is geen door AI gegenereerde inhoud. De generaties op de tijdlijn zijn afgeleid uit de afstamming in de infoboxen van Wikipedia — mythen hebben geen kalender.',
    'foot.short': 'Tekst: bijdragers van {wp}, {cc} · Afbeeldingen: {commons}, publiek domein · niets door AI gegenereerd',
    'wp.name': 'de Engelstalige Wikipedia', 'nlwp.name': 'de Nederlandstalige Wikipedia', 'wp.short': 'Wikipedia',
  },
};

let current = 'en';
try {
  const saved = localStorage.getItem('mythographia-lang');
  if (LANGS.includes(saved)) current = saved;
  else if ((navigator.language || '').toLowerCase().startsWith('nl')) current = 'nl';
} catch { /* storage unavailable */ }

export const getLang = () => current;
export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  current = lang;
  try { localStorage.setItem('mythographia-lang', lang); } catch { /* storage unavailable */ }
  document.documentElement.lang = lang;
}

export function t(key, vars = {}) {
  const s = STRINGS[current][key] ?? STRINGS.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

// "Rhea (mythology)" -> "Rhea", "Herakles (mythologie)" -> "Herakles".
export const stripDisambiguation = (title) => title.replace(/\s*\([^()]*\)\s*$/, '').trim() || title;

// Content for a node in the current language: Dutch Wikipedia's own article
// when there is one, otherwise the English one with `fallback: true`.
export function content(n) {
  const nl = current === 'nl' ? n.i18n?.nl : null;
  if (nl) return { ...nl, lang: 'nl', fallback: false };
  return {
    title: n.title, description: n.description, extract: n.extract, funFact: n.funFact,
    url: n.url, revision: n.revision, lang: 'en', fallback: current === 'nl',
  };
}

// Short display names for every node in the current language. Where stripping
// the "(…)" would make two names collide, the full title is kept for both.
export function assignNames(nodes) {
  const counts = new Map();
  const base = nodes.map((n) => stripDisambiguation(content(n).title));
  for (const b of base) counts.set(b, (counts.get(b) || 0) + 1);
  nodes.forEach((n, i) => {
    n.name = counts.get(base[i]) > 1 ? content(n).title : base[i];
  });
}

// Static markup: elements with data-i18n="key" get their text; data-i18n-attr="attr:key,attr:key".
export function applyStatic(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(',')) {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr, t(key));
    }
  }
}
