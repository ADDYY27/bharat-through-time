// backend/src/importers/discoverRulersByPolity.js
// Run with: node src/importers/discoverRulersByPolity.js Q6124144 "Jaipur State"
//
// Mode 2: polity-based discovery. Given a POLITY/STATE QID (not an office
// QID), finds people whose "position held" statement is qualified as
// applying to that polity — via P1001 (applies to jurisdiction) or P642
// (of), which is how Wikidata models rulers of states that don't have a
// clean standalone "Maharaja of X" office entity.
//
// This is discovery only — prints candidates, writes nothing to MongoDB.

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "BharatThroughTime/0.1 (educational project; contact: none)";

async function discoverRulersByPolity(polityQid, noteLabel) {
  const query = `
    SELECT DISTINCT ?person ?personLabel ?positionLabel ?start ?end ?matchedVia WHERE {
      {
        ?person p:P39 ?statement .
        ?statement ps:P39 ?position .
        ?position wdt:P1001 wd:${polityQid} .
        BIND("applies to jurisdiction (P1001)" AS ?matchedVia)
        OPTIONAL { ?statement pq:P580 ?start . }
        OPTIONAL { ?statement pq:P582 ?end . }
      } UNION {
        ?person p:P39 ?statement .
        ?statement ps:P39 ?position .
        ?position wdt:P642 wd:${polityQid} .
        BIND("of (P642)" AS ?matchedVia)
        OPTIONAL { ?statement pq:P580 ?start . }
        OPTIONAL { ?statement pq:P582 ?end . }
      } UNION {
        wd:${polityQid} wdt:P1313 ?person .
        BIND("head of organization (P1313, direct)" AS ?matchedVia)
        BIND("(not specified)" AS ?positionLabel)
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY ?start
  `;

  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error(`SPARQL request failed: ${res.status}`);
  const data = await res.json();

  if (data.results.bindings.length === 0) {
    console.log(`\nNo candidates found for "${noteLabel || polityQid}" (${polityQid}) via P1001/P642 matching.`);
    console.log(`This polity may not have its rulers' positions qualified this way in Wikidata —`);
    console.log(`may need person/event-based discovery (Mode 3) instead, i.e. verify known ruler names individually.`);
    return;
  }

  console.log(`\nCandidates for "${noteLabel || polityQid}" (${polityQid}):\n`);
  data.results.bindings.forEach((row) => {
    const qid = row.person.value.split("/").pop();
    const label = row.personLabel?.value || "(no label)";
    const position = row.positionLabel?.value || "(unknown position)";
    const start = row.start?.value ? new Date(row.start.value).getFullYear() : "?";
    const end = row.end?.value ? new Date(row.end.value).getFullYear() : "?";
    const via = row.matchedVia?.value || "?";
    console.log(`${qid}  —  ${label}  (${start}–${end})  [${position}, matched via ${via}]`);
  });
  console.log(`\n${data.results.bindings.length} candidate(s) found.`);
  console.log(`Review carefully before adding any to CURATED_RULERS — this mode casts a`);
  console.log(`wider net than office-based discovery and may include false positives.`);
}

const [polityQid, ...labelParts] = process.argv.slice(2);
if (!polityQid) {
  console.error('Usage: node src/importers/discoverRulersByPolity.js Q123456 "optional label"');
  process.exit(1);
}

discoverRulersByPolity(polityQid, labelParts.join(" ")).catch((err) => {
  console.error("Discovery failed:", err.message);
  process.exit(1);
});
