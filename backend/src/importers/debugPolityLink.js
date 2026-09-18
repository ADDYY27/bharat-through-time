// backend/src/importers/debugPolityLink.js
// Run with: node src/importers/debugPolityLink.js Q613006 Q1240096
//
// Diagnostic only. Checks whether an OFFICE item (e.g. "Nizam of Hyderabad")
// has ANY P1001 or P642 statement at all, and if so, what it points to.
// This isolates whether discoverRulersByPolity.js's zero-result problem is
// a genuine missing link in Wikidata, vs a bug in our SPARQL.

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "BharatThroughTime/0.1 (educational project; contact: none)";

async function debugLink(officeQid, expectedStateQid) {
  const query = `
    SELECT ?prop ?propLabel ?value ?valueLabel WHERE {
      VALUES ?prop { wdt:P1001 wdt:P642 }
      wd:${officeQid} ?prop ?value .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error(`SPARQL request failed: ${res.status}`);
  const data = await res.json();

  console.log(`\nChecking what P1001/P642 statements exist on ${officeQid}...\n`);
  if (data.results.bindings.length === 0) {
    console.log(`NONE. ${officeQid} has no P1001 or P642 statement at all.`);
    console.log(`This confirms: the office item simply isn't linked to its state this way in Wikidata.`);
    console.log(`Mode 2 (discoverRulersByPolity.js) cannot work for this polity via this path — not a bug, a real data gap.`);
  } else {
    data.results.bindings.forEach((row) => {
      const propId = row.prop.value.split("/").pop();
      const valueId = row.value.value.split("/").pop();
      const match = valueId === expectedStateQid ? " <-- MATCHES expected state QID" : " <-- points somewhere else";
      console.log(`${propId} -> ${valueId} (${row.valueLabel?.value || "?"})${match}`);
    });
  }
  console.log("");
}

const [officeQid, expectedStateQid] = process.argv.slice(2);
if (!officeQid) {
  console.error("Usage: node src/importers/debugPolityLink.js <officeQid> <expectedStateQid>");
  process.exit(1);
}

debugLink(officeQid, expectedStateQid).catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
