// Reads the whole graph from Postgres in the compact shape the browser uses.
// `sql` is a tagged-template query function (@neondatabase/serverless `neon()`).

export async function loadGraph(sql) {
  const [nodes, edges, runs, i18n] = await Promise.all([
    sql`select n.id, n.title, n.type, n.description, n.extract, n.fun_fact, n.fun_fact_section,
               n.generation, n.wiki_url, n.revision_id,
               i.thumb_url, i.thumb_width, i.thumb_height, i.commons_url, i.artist, i.date_text,
               i.license, i.object_name, i.file_title
          from nodes n left join images i on i.node_id = n.id
         order by n.id`,
    sql`select source, target, rel, provenance from edges order by source, target, rel`,
    sql`select finished_at from ingest_runs where finished_at is not null order by id desc limit 1`,
    sql`select node_id, lang, title, description, extract, fun_fact, fun_fact_section, wiki_url, revision_id from node_i18n`,
  ]);
  return toApiGraph(nodes, edges, runs[0]?.finished_at ?? null, i18n);
}

// Row shape: node columns plus the flattened image columns.
// i18nRows: node_i18n rows (other-language Wikipedia versions of the same article).
export function toApiGraph(nodeRows, edgeRows, ingestedAt, i18nRows = []) {
  const i18n = new Map();
  for (const r of i18nRows) {
    if (!i18n.has(r.node_id)) i18n.set(r.node_id, {});
    i18n.get(r.node_id)[r.lang] = {
      title: r.title,
      description: r.description,
      extract: r.extract,
      funFact: r.fun_fact ? { text: r.fun_fact, section: r.fun_fact_section } : null,
      url: r.wiki_url,
      revision: r.revision_id ? Number(r.revision_id) : null,
    };
  }
  return {
    meta: {
      source: 'English and Dutch Wikipedia (text, CC BY-SA 4.0) and Wikimedia Commons (public-domain images)',
      ingestedAt,
      counts: { nodes: nodeRows.length, edges: edgeRows.length },
    },
    nodes: nodeRows.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      description: n.description,
      extract: n.extract,
      funFact: n.fun_fact ? { text: n.fun_fact, section: n.fun_fact_section } : null,
      generation: n.generation,
      url: n.wiki_url,
      revision: n.revision_id ? Number(n.revision_id) : null,
      image: n.thumb_url
        ? {
            thumb: n.thumb_url,
            w: n.thumb_width,
            h: n.thumb_height,
            page: n.commons_url,
            file: n.file_title,
            artist: n.artist,
            date: n.date_text,
            license: n.license,
            title: n.object_name,
          }
        : null,
      i18n: i18n.get(n.id) ?? {},
    })),
    edges: edgeRows.map((e) => ({ s: e.source, t: e.target, rel: e.rel, src: e.provenance })),
  };
}
