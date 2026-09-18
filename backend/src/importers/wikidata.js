// backend/src/importers/wikidata.js
// Small helper library for pulling structured facts from Wikidata + a plain-language
// summary from DBpedia. Used by importRulers.js and similar importer scripts.

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "BharatThroughTime/0.1 (educational project; contact: none)";

// Wikidata requires a descriptive User-Agent on requests, or it may throttle/block.
// Wikidata sometimes has malformed or unusually-formatted date values (e.g.
// proleptic calendar dates for very old events) that JS's Date parser turns
// into NaN rather than throwing. Returning NaN into a Mongoose Number field
// crashes the whole import — this guards against that.
function safeYear(dateString) {
  if (!dateString) return null;
  const year = new Date(dateString).getFullYear();
  return Number.isNaN(year) ? null : year;
}

async function wdFetch(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error(`Wikidata request failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch core facts for a single Wikidata entity (a person or a place).
 * Returns: { label, description, birthYear, deathYear, image, coordinates, wikipediaTitle }
 */
export async function getEntity(qid) {
  const query = `
    SELECT ?label ?description ?birth ?death ?image ?coord ?article WHERE {
      OPTIONAL { wd:${qid} rdfs:label ?label . FILTER(LANG(?label) = "en") }
      OPTIONAL { wd:${qid} schema:description ?description . FILTER(LANG(?description) = "en") }
      OPTIONAL { wd:${qid} wdt:P569 ?birth . }
      OPTIONAL { wd:${qid} wdt:P570 ?death . }
      OPTIONAL { wd:${qid} wdt:P18 ?image . }
      OPTIONAL { wd:${qid} wdt:P625 ?coord . }
      OPTIONAL {
        ?article schema:about wd:${qid} ;
                 schema:isPartOf <https://en.wikipedia.org/> .
      }
    } LIMIT 1
  `;
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const data = await wdFetch(url);
  const row = data.results.bindings[0];
  if (!row) return null;

  let coordinates = null;
  if (row.coord?.value) {
    // Wikidata returns "Point(lng lat)"
    const match = row.coord.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
    if (match) coordinates = [parseFloat(match[1]), parseFloat(match[2])];
  }

  return {
    label: row.label?.value || null,
    description: row.description?.value || null,
    birthYear: safeYear(row.birth?.value),
    deathYear: safeYear(row.death?.value),
    image: row.image?.value || null,
    coordinates, // [lng, lat] or null
    wikipediaTitle: row.article?.value
      ? decodeURIComponent(row.article.value.split("/wiki/")[1]).replace(/_/g, " ")
      : null,
  };
}

/**
 * Fetch a short plain-language summary paragraph from DBpedia for a given
 * Wikipedia article title. DBpedia abstracts are derived from Wikipedia text
 * (CC BY-SA) — always store the source URL alongside anything imported from here.
 */
export async function getDBpediaAbstract(wikipediaTitle) {
  if (!wikipediaTitle) return null;
  const resourceName = wikipediaTitle.replace(/ /g, "_");
  const url = `https://dbpedia.org/data/${encodeURIComponent(resourceName)}.json`;

  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const resourceKey = `http://dbpedia.org/resource/${resourceName}`;
    const abstracts = data[resourceKey]?.["http://dbpedia.org/ontology/abstract"];
    if (!abstracts) return null;
    const en = abstracts.find((a) => a.lang === "en");
    return en?.value || null;
  } catch {
    return null; // DBpedia can be flaky; importer should continue without a bio rather than crash
  }
}

export function wikidataUrl(qid) {
  return `https://www.wikidata.org/wiki/${qid}`;
}
