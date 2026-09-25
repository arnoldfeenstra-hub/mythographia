import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseInfobox, familyFromInfobox, extractLinks, leadSection, stripRefs, imageCandidates,
  isPublicDomain, imageRecord, pickFunFact, firstSentences, typeFromDescription, normalizeTitle, slugify,
} from '../ingest/parse.js';

// Placeholder names only: these fixtures test wikitext syntax, not myth content.
const WT = `{{Short description|Test}}
{{Infobox deity
| name = Alpha
| image = Alpha vase.jpg
| parents = [[Beta (test)|Beta]] and [[Gamma]]<ref>{{cite book|title=[[Ignored ref link]]}}</ref>
| siblings = {{hlist|[[Delta]]|[[Epsilon#Section|Eps]]}}
| consort = [[Zeta]]
| children = [[Eta]], [[Theta]]
| symbol = [[File:Icon.svg|20px]] lightning
}}
'''Alpha''' is linked to [[Iota]] and [[Kappa (test)|Kappa]] and [[Category:Nope]].
[[File:Second image.JPG|thumb|caption with [[Lambda]]]]

== Myths ==
Body text with [[Mu]].
<gallery>
File:Gallery one.png|cap
</gallery>`;

test('parseInfobox reads top-level params and ignores refs', () => {
  const box = parseInfobox(WT);
  assert.equal(box.name, 'Infobox deity');
  assert.match(box.params.parents, /Beta/);
  assert.doesNotMatch(box.params.parents, /Ignored/);
  assert.match(box.params.siblings, /hlist/);
});

test('familyFromInfobox maps params to directed relations', () => {
  const fam = familyFromInfobox(parseInfobox(WT));
  const pick = (t) => fam.filter((f) => f.target === t).map((f) => `${f.rel}:${f.dir}`);
  assert.deepEqual(pick('Beta (test)'), ['parent:in']);
  assert.deepEqual(pick('Gamma'), ['parent:in']);
  assert.deepEqual(pick('Delta'), ['sibling:out']);
  assert.deepEqual(pick('Epsilon'), [], 'anchored link is a section, not a person');
  assert.deepEqual(pick('Zeta'), ['consort:out']);
  assert.deepEqual(pick('Eta'), ['parent:out']);
  assert.equal(fam.some((f) => f.target === 'Ignored ref link'), false);
});

test('lead links exclude namespaces and later sections', () => {
  const links = extractLinks(leadSection(stripRefs(WT)));
  assert.ok(links.includes('Iota'));
  assert.ok(links.includes('Kappa (test)'));
  assert.ok(!links.includes('Mu'));
  assert.ok(!links.some((l) => /^(Category|File):/.test(l)));
});

test('image candidates keep order, drop svg', () => {
  assert.deepEqual(imageCandidates(WT), ['File:Alpha vase.jpg', 'File:Second image.JPG', 'File:Gallery one.png']);
});

test('only public domain / CC0 images pass', () => {
  assert.equal(isPublicDomain({ License: { value: 'pd' } }), true);
  assert.equal(isPublicDomain({ LicenseShortName: { value: 'Public domain' } }), true);
  assert.equal(isPublicDomain({ License: { value: 'cc0' } }), true);
  assert.equal(isPublicDomain({ LicenseShortName: { value: 'PD-Art (PD-old-100)' } }), true);
  assert.equal(isPublicDomain({ License: { value: 'cc-by-sa-4.0' }, LicenseShortName: { value: 'CC BY-SA 4.0' } }), false);
  assert.equal(isPublicDomain({}), false);
  assert.equal(isPublicDomain(undefined), false);
  const rec = imageRecord({
    title: 'File:X.jpg',
    imageinfo: [{ url: 'u', thumburl: 't', width: 900, height: 600, descriptionurl: 'd',
      extmetadata: { License: { value: 'pd' }, Artist: { value: '<a href="x">Some Painter</a>' }, DateTimeOriginal: { value: '1600' } } }],
  });
  assert.equal(rec.artist, 'Some Painter');
  assert.equal(rec.thumb_url, 't');
  assert.equal(imageRecord({ title: 'File:Y.jpg', imageinfo: [{ extmetadata: { License: { value: 'cc-by-4.0' } } }] }), null);
});

test('fun fact is a verbatim opening of a named section', () => {
  const text = 'Lead paragraph here that is long enough to count as text.\n\n== Etymology ==\nThe name derives from an old word meaning something. A second sentence follows here. A third one.\n\n== Other ==\nx';
  const f = pickFunFact(text);
  assert.equal(f.section, 'Etymology');
  assert.ok(text.includes(f.text));
  assert.equal(pickFunFact('Only a lead, no sections at all.'), null);
  assert.equal(firstSentences('x'.repeat(400), 300), null, 'never cuts a sentence');
});

test('expansion typing requires a Greek-myth description', () => {
  assert.equal(typeFromDescription('Greek goddess of something'), 'deity');
  assert.equal(typeFromDescription('Titan in Greek mythology'), 'titan');
  assert.equal(typeFromDescription('Monster in Greek mythology'), 'creature');
  assert.equal(typeFromDescription('King in Greek mythology'), 'mortal');
  assert.equal(typeFromDescription('American actor'), null);
  assert.equal(typeFromDescription(null), null);
});

test('titles normalise and slug', () => {
  assert.equal(normalizeTitle('foo_bar#baz'), 'Foo bar');
  assert.equal(normalizeTitle('#anchor'), null);
  assert.equal(slugify('Pasiphaë'), 'pasiphae');
  assert.equal(slugify('Chaos (cosmogony)'), 'chaos-cosmogony');
});

import { funFactFromWikitext, wikitextToPlain } from '../ingest/parse.js';

test('fun fact from wikitext keeps text verbatim and skips template gaps', () => {
  const wt = `Lead.\n== Etymology ==\n{{Main|Something}}\nThe name ''Alpha'' ({{lang|grc|Ἄλφα}}) comes from a placeholder root meaning "first thing" in an old tongue.<ref>{{cite book|title=X}}</ref> Another sentence follows it here.\n\n== Myths ==\nText.`;
  const f = funFactFromWikitext(wt);
  assert.equal(f.section, 'Etymology');
  assert.equal(f.text, 'The name Alpha (Ἄλφα) comes from a placeholder root meaning "first thing" in an old tongue.');
});

test('fun fact skips sentences where a template would leave a gap', () => {
  const wt = `== Etymology ==\nThe word is pronounced {{IPA|/x/}} by some speakers of the placeholder tongue today.\n\n== Iconography ==\nIn placeholder art the figure is usually shown holding a [[Beta (object)|beta]] and wearing a long cloak.`;
  const f = funFactFromWikitext(wt);
  assert.equal(f.section, 'Iconography');
  assert.equal(f.text, 'In placeholder art the figure is usually shown holding a beta and wearing a long cloak.');
  assert.equal(funFactFromWikitext('== Myths ==\nNo named fact section here at all, just some long placeholder text.'), null);
});

test('wikitextToPlain converts links and drops refs and files', () => {
  assert.equal(wikitextToPlain("[[File:x.jpg|thumb|cap]]\n'''Bold''' [[Target|shown]] and [[Plain]]<ref>r</ref>").trim(), 'Bold shown and Plain');
});

test('infobox family links to a section anchor are not people', () => {
  const box = parseInfobox('{{Infobox deity\n| siblings = [[Gamma]], [[Delta#Offspring|many half-siblings]]\n}}');
  assert.deepEqual(familyFromInfobox(box).map((f) => f.target), ['Gamma']);
});

test('expansion typing: set-index pages skipped, generic descriptions unclassified', () => {
  assert.equal(typeFromDescription('Multiple Greek mythological figures'), null);
  assert.equal(typeFromDescription('Set of mythological Greek characters'), null);
  assert.equal(typeFromDescription('Greek mythological figure'), 'figure');
  assert.equal(typeFromDescription('Son of a placeholder in Greek mythology'), 'figure');
  assert.equal(typeFromDescription('Pre-Olympian gods in Greek mythology'), 'titan');
  assert.equal(typeFromDescription('Theban princess in Greek mythology'), 'mortal');
});

test('Dutch fun facts use Dutch section names', () => {
  const wt = `Inleiding.\n== Etymologie ==\nDe naam Alfa is afgeleid van een oud woord dat zoiets als "eerste ding" betekent in een oude taal.\n\n== Mythe ==\nTekst.`;
  const f = funFactFromWikitext(wt, 300, 'nl');
  assert.equal(f.section, 'Etymologie');
  assert.ok(wt.includes(f.text));
  assert.equal(funFactFromWikitext(wt, 300, 'en'), null, 'English section names do not match Dutch headings');
});

test('poets and historians are not myth figures', () => {
  assert.equal(typeFromDescription('Ancient Greek poet'), null);
  assert.equal(typeFromDescription('Ancient Greek epic poet'), null);
  assert.equal(typeFromDescription('Greek historian'), null);
  assert.equal(typeFromDescription('Nymph in Greek mythology'), 'deity');
});
