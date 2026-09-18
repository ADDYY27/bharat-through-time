// backend/src/importers/discoverRulers.js
// Run with: node src/importers/discoverRulers.js Q123456 "Label for your notes"
//
// Given a Wikidata QID for a POSITION/OFFICE (e.g. "Mughal emperor", "Peshwa"),
// finds every person recorded as having held that position, with start/end
// dates where available. Prints a clean candidate list — does NOT write to
// MongoDB. Review the output, then copy the QIDs you want into
// CURATED_RULERS in importRulers.js.
//
// First confirm your office QID with: node src/importers/findEntity.js "search term"

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "BharatThroughTime/0.1 (educational project; contact: none)";

async function discoverRulers(officeQid, noteLabel) {
  const query = `
    SELECT ?person ?personLabel ?start ?end WHERE {
      ?person p:P39 ?statement .
      ?statement ps:P39 wd:${officeQid} .
      OPTIONAL { ?statement pq:P580 ?start . }
      OPTIONAL { ?statement pq:P582 ?end . }
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
    console.log(`No position-holders found for ${officeQid}. Either the QID is wrong, or Wikidata doesn't model this office with P39 statements — try a broader search.`);
    return;
  }

  console.log(`\nCandidates for "${noteLabel || officeQid}" (${officeQid}):\n`);
  data.results.bindings.forEach((row) => {
    const qid = row.person.value.split("/").pop();
    const label = row.personLabel?.value || "(no label)";
    const start = row.start?.value ? new Date(row.start.value).getFullYear() : "?";
    const end = row.end?.value ? new Date(row.end.value).getFullYear() : "?";
    console.log(`${qid}  —  ${label}  (${start}–${end})`);
  });
  console.log(`\n${data.results.bindings.length} candidate(s) found. Copy the QIDs you want into CURATED_RULERS in importRulers.js.`);
}

const [officeQid, ...labelParts] = process.argv.slice(2);
if (!officeQid) {
  console.error('Usage: node src/importers/discoverRulers.js Q123456 "optional label"');
  process.exit(1);
}

discoverRulers(officeQid, labelParts.join(" ")).catch((err) => {
  console.error("Discovery failed:", err.message);
  process.exit(1);
});
