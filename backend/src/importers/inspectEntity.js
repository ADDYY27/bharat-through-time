// backend/src/importers/inspectEntity.js
// Run with: node src/importers/inspectEntity.js Q203233
//
// Prints the full getEntity() result for any QID — label, description,
// birth/death years, image, coordinates, Wikipedia title. Useful for
// checking whether an entity (e.g. a battle) carries its own coordinates
// before deciding whether it can serve as a Place, without writing a new
// one-off script each time.

import { getEntity } from "./wikidata.js";

async function inspect(qid) {
  const entity = await getEntity(qid);
  if (!entity) {
    console.log(`No data returned for ${qid}.`);
    return;
  }
  console.log(`\n${qid}:`);
  console.log(JSON.stringify(entity, null, 2));
}

const qid = process.argv[2];
if (!qid) {
  console.error("Usage: node src/importers/inspectEntity.js Q123456");
  process.exit(1);
}

inspect(qid).catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});