// Writes one ingest run to Postgres over Neon's HTTPS driver, as a single
// transaction: the previous snapshot is replaced only if every insert succeeds.
// Bulk inserts go through json_to_recordset, so each table is one statement.

const json = (rows) => JSON.stringify(rows);

export async function writeGraph(sql, graph, i18nRows, report, seedCount) {
  const nodes = graph.nodes.map((n) => ({
    id: n.id, title: n.title, type: n.type, type_source: n.type_source, description: n.description,
    extract: n.extract, fun_fact: n.fun_fact, fun_fact_section: n.fun_fact_section,
    generation: n.generation, wiki_url: n.wiki_url, revision_id: n.revision_id,
  }));
  const images = graph.nodes.filter((n) => n.image).map((n) => ({ node_id: n.id, ...n.image }));
  const edges = graph.edges.map((e) => ({ source: e.s, target: e.t, rel: e.rel, provenance: e.provenance }));
  const imageCount = images.length;

  await sql.transaction((tx) => [
    tx`insert into ingest_runs (seed_count) values (${seedCount})`,
    tx`delete from node_i18n`,
    tx`delete from edges`,
    tx`delete from images`,
    tx`delete from nodes`,
    tx`insert into nodes (id, title, type, type_source, description, extract, fun_fact, fun_fact_section,
                          generation, wiki_url, revision_id, run_id)
       select x.id, x.title, x.type, x.type_source, x.description, x.extract, x.fun_fact, x.fun_fact_section,
              x.generation, x.wiki_url, x.revision_id, currval(pg_get_serial_sequence('ingest_runs', 'id'))
         from json_to_recordset(${json(nodes)}::json) as x(
              id text, title text, type text, type_source text, description text, extract text,
              fun_fact text, fun_fact_section text, generation real, wiki_url text, revision_id bigint)`,
    tx`insert into images (node_id, file_title, thumb_url, thumb_width, thumb_height, original_url, commons_url,
                           artist, date_text, license, credit, object_name)
       select * from json_to_recordset(${json(images)}::json) as x(
              node_id text, file_title text, thumb_url text, thumb_width int, thumb_height int, original_url text,
              commons_url text, artist text, date_text text, license text, credit text, object_name text)`,
    tx`insert into edges (source, target, rel, provenance)
       select * from json_to_recordset(${json(edges)}::json) as x(source text, target text, rel text, provenance text)`,
    tx`insert into node_i18n (node_id, lang, title, description, extract, fun_fact, fun_fact_section, wiki_url, revision_id)
       select * from json_to_recordset(${json(i18nRows)}::json) as x(
              node_id text, lang text, title text, description text, extract text, fun_fact text,
              fun_fact_section text, wiki_url text, revision_id bigint)`,
    tx`update ingest_runs
          set finished_at = now(), node_count = ${nodes.length}, edge_count = ${edges.length},
              image_count = ${imageCount}, report = ${json(report)}::jsonb
        where id = currval(pg_get_serial_sequence('ingest_runs', 'id'))`,
  ]);
}
