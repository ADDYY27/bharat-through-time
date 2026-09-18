// backend/src/importers/findEntity.js
// Run with: node src/importers/findEntity.js "search term"
//
// Looks up a search term against Wikidata's entity search and prints candidate
// QIDs with their descriptions, so you can visually confirm the right one
// before using it in discoverRulers.js. This step exists specifically so we
// never guess/hardcode a QID from memory — every ID used downstream is
// verified against the live Wikidata search result.

const USER_AGENT = "BharatThroughTime/0.1 (educational project; contact: none)";

async function findEntity(term) {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    term
  )}&language=en&format=json&limit=10`;

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();

  if (!data.search || data.search.length === 0) {
    console.log(`No results for "${term}".`);
    return;
  }

  console.log(`\nResults for "${term}":\n`);
  data.search.forEach((r) => {
    console.log(`${r.id}  —  ${r.label}`);
    if (r.description) console.log(`        ${r.description}`);
    console.log(`        https://www.wikidata.org/wiki/${r.id}\n`);
  });
}

const term = process.argv.slice(2).join(" ");
if (!term) {
  console.error('Usage: node src/importers/findEntity.js "search term"');
  process.exit(1);
}

findEntity(term).catch((err) => {
  console.error("Search failed:", err.message);
  process.exit(1);
});
