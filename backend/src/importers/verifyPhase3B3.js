// backend/src/importers/verifyPhase3B3.js
// Run with: node src/importers/verifyPhase3B3.js
//
// Verification script for Phase 3B.3 — Import Verified Historical Events.

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../db.js";
import Polity from "../models/Polity.js";
import Place from "../models/Place.js";
import Ruler from "../models/Ruler.js";
import Event from "../models/Event.js";
import Source from "../models/Source.js";

dotenv.config();

async function runVerification() {
  console.log("==================================================");
  console.log("Phase 3B.3 Post-Import Verification");
  console.log("==================================================");

  await connectDB();

  let errorCount = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`  ❌ FAIL: ${message}`);
      errorCount++;
    } else {
      console.log(`  ✅ PASS: ${message}`);
    }
  }

  // 1. Database Collection Counts
  console.log("\n--- Checking Database Collection Counts ---");
  const politiesCount = await Polity.countDocuments();
  const placesCount = await Place.countDocuments();
  const rulersCount = await Ruler.countDocuments();
  const territoriesCount = await mongoose.connection.db.collection("territories").countDocuments();
  const eventsCount = await Event.countDocuments();
  const sourcesCount = await Source.countDocuments();

  console.log({
    polities: politiesCount,
    places: placesCount,
    rulers: rulersCount,
    territories: territoriesCount,
    events: eventsCount,
    sources: sourcesCount,
  });

  assert(politiesCount === 14, `Expected exactly 14 polities, found ${politiesCount}`);
  assert(placesCount === 66, `Expected exactly 66 places (64 + 2 new: Merta City, Lalsot), found ${placesCount}`);
  assert(rulersCount === 64, `Expected exactly 64 rulers, found ${rulersCount}`);
  assert(territoriesCount === 19, `Expected exactly 19 territories, found ${territoriesCount}`);
  assert(eventsCount === 34, `Expected exactly 34 events (29 + 5 new), found ${eventsCount}`);
  assert(sourcesCount >= 166, `Expected at least 166 sources, found ${sourcesCount}`);

  // 2. Verify Places
  console.log("\n--- Verifying Places ---");
  const amritsar = await Place.findOne({ name: "Amritsar" });
  assert(amritsar && amritsar.location?.coordinates[0] === 74.87704, "Amritsar place exists with coordinates [74.87704, 31.626917]");

  const jodhpur = await Place.findOne({ name: "Jodhpur" });
  assert(jodhpur && jodhpur.location?.coordinates[0] === 73.0278, "Jodhpur place exists with coordinates [73.0278, 26.2944]");

  const udaipur = await Place.findOne({ name: "Udaipur" });
  assert(udaipur && udaipur.location?.coordinates[0] === 73.6833, "Udaipur place exists with coordinates [73.6833, 24.5833]");

  const merta = await Place.findOne({ name: "Merta City" });
  assert(merta && merta.location?.coordinates[0] === 74.0333 && merta.location?.coordinates[1] === 26.65, "Merta City place exists with coordinates [74.0333, 26.65]");

  const lalsot = await Place.findOne({ name: "Lalsot" });
  assert(lalsot && lalsot.location?.coordinates[0] === 76.33 && lalsot.location?.coordinates[1] === 26.57, "Lalsot place exists with coordinates [76.33, 26.57]");

  // Check no duplicate places
  const duplicatePlaces = await Place.aggregate([
    { $group: { _id: "$name", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  assert(duplicatePlaces.length === 0, `Duplicate place names in database: ${duplicatePlaces.length}`);

  // 3. Verify Events
  console.log("\n--- Verifying 5 Imported Events ---");

  // Event 1: Battle of Tunga / Lalsot
  const tunga = await Event.findOne({ title: "Battle of Tunga / Lalsot" })
    .populate("place")
    .populate("polities")
    .populate("rulers")
    .populate("sources");
  assert(tunga, "Battle of Tunga / Lalsot exists");
  if (tunga) {
    assert(tunga.year === 1787, "Tunga year is 1787");
    assert(tunga.type === "battle", "Tunga type is 'battle'");
    assert(tunga.place?.name === "Lalsot", "Tunga place is Lalsot");
    const polNames = tunga.polities.map(p => p.name).sort();
    assert(
      polNames.includes("Maratha Confederacy") && polNames.includes("Kingdom of Marwar") && polNames.includes("Jaipur State"),
      `Tunga polities include Maratha, Marwar, Jaipur (found: ${polNames.join(", ")})`
    );
    const rulerNames = tunga.rulers.map(r => r.name).sort();
    assert(
      rulerNames.includes("Vijay Singh of Marwar") && rulerNames.includes("Sawai Pratap Singh") && rulerNames.includes("Madhavrao II"),
      `Tunga rulers include Vijay Singh, Sawai Pratap Singh, Madhavrao II (found: ${rulerNames.join(", ")})`
    );
    assert(tunga.sources?.length >= 1, "Tunga has sources attached");
  }

  // Event 2: Battle of Merta
  const mertaEvent = await Event.findOne({ title: "Battle of Merta" })
    .populate("place")
    .populate("polities")
    .populate("rulers")
    .populate("sources");
  assert(mertaEvent, "Battle of Merta exists");
  if (mertaEvent) {
    assert(mertaEvent.year === 1790, "Merta year is 1790");
    assert(mertaEvent.type === "battle", "Merta type is 'battle'");
    assert(mertaEvent.place?.name === "Merta City", "Merta place is Merta City");
    const polNames = mertaEvent.polities.map(p => p.name).sort();
    assert(
      polNames.includes("Maratha Confederacy") && polNames.includes("Kingdom of Marwar"),
      `Merta polities include Maratha and Marwar (found: ${polNames.join(", ")})`
    );
    const rulerNames = mertaEvent.rulers.map(r => r.name).sort();
    assert(
      rulerNames.includes("Vijay Singh of Marwar") && rulerNames.includes("Madhavrao II"),
      `Merta rulers include Vijay Singh and Madhavrao II (found: ${rulerNames.join(", ")})`
    );
    assert(mertaEvent.sources?.length >= 1, "Merta has sources attached");
  }

  // Event 3: Treaty of Amritsar
  const amritsarTreaty = await Event.findOne({ title: "Treaty of Amritsar" })
    .populate("place")
    .populate("polities")
    .populate("rulers")
    .populate("sources");
  assert(amritsarTreaty, "Treaty of Amritsar exists");
  if (amritsarTreaty) {
    assert(amritsarTreaty.year === 1809, "Amritsar treaty year is 1809");
    assert(amritsarTreaty.type === "treaty", "Amritsar treaty type is 'treaty'");
    assert(amritsarTreaty.place?.name === "Amritsar", "Amritsar treaty place is Amritsar");
    const polNames = amritsarTreaty.polities.map(p => p.name);
    assert(polNames.includes("Sikh Empire"), `Amritsar treaty polity is Sikh Empire (found: ${polNames.join(", ")})`);
    const rulerNames = amritsarTreaty.rulers.map(r => r.name);
    assert(rulerNames.includes("Ranjit Singh"), `Amritsar treaty ruler is Ranjit Singh (found: ${rulerNames.join(", ")})`);
    assert(amritsarTreaty.sources?.length >= 1, "Amritsar treaty has sources attached");
  }

  // Event 4: Treaty of Jodhpur / Marwar Subsidiary Alliance
  const jodhpurTreaty = await Event.findOne({ title: "Treaty of Jodhpur / Marwar Subsidiary Alliance" })
    .populate("place")
    .populate("polities")
    .populate("rulers")
    .populate("sources");
  assert(jodhpurTreaty, "Treaty of Jodhpur exists");
  if (jodhpurTreaty) {
    assert(jodhpurTreaty.year === 1818, "Jodhpur treaty year is 1818");
    assert(jodhpurTreaty.type === "treaty", "Jodhpur treaty type is 'treaty'");
    assert(jodhpurTreaty.place?.name === "Jodhpur", "Jodhpur treaty place is Jodhpur");
    const polNames = jodhpurTreaty.polities.map(p => p.name);
    assert(polNames.includes("Kingdom of Marwar"), `Jodhpur treaty polity is Kingdom of Marwar (found: ${polNames.join(", ")})`);
    const rulerNames = jodhpurTreaty.rulers.map(r => r.name);
    assert(rulerNames.includes("Man Singh of Marwar"), `Jodhpur treaty ruler is Man Singh of Marwar (found: ${rulerNames.join(", ")})`);
    assert(jodhpurTreaty.sources?.length >= 1, "Jodhpur treaty has sources attached");
  }

  // Event 5: Treaty of Udaipur / Mewar Subsidiary Alliance
  const udaipurTreaty = await Event.findOne({ title: "Treaty of Udaipur / Mewar Subsidiary Alliance" })
    .populate("place")
    .populate("polities")
    .populate("rulers")
    .populate("sources");
  assert(udaipurTreaty, "Treaty of Udaipur exists");
  if (udaipurTreaty) {
    assert(udaipurTreaty.year === 1818, "Udaipur treaty year is 1818");
    assert(udaipurTreaty.type === "treaty", "Udaipur treaty type is 'treaty'");
    assert(udaipurTreaty.place?.name === "Udaipur", "Udaipur treaty place is Udaipur");
    const polNames = udaipurTreaty.polities.map(p => p.name);
    assert(polNames.includes("Kingdom of Mewar"), `Udaipur treaty polity is Kingdom of Mewar (found: ${polNames.join(", ")})`);
    const rulerNames = udaipurTreaty.rulers.map(r => r.name);
    assert(rulerNames.includes("Bhim Singh of Mewar"), `Udaipur treaty ruler is Bhim Singh of Mewar (found: ${rulerNames.join(", ")})`);
    assert(udaipurTreaty.sources?.length >= 1, "Udaipur treaty has sources attached");
  }

  // 4. Confirm Hurda Conference is NOT imported
  console.log("\n--- Confirming Exclusions ---");
  const hurdaEvent = await Event.findOne({ title: /hurda/i });
  assert(!hurdaEvent, "Hurda Conference was correctly NOT imported (as instructed)");

  // Check no duplicate event titles
  const duplicateEvents = await Event.aggregate([
    { $group: { _id: "$title", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  assert(duplicateEvents.length === 0, `Duplicate event titles in database: ${duplicateEvents.length}`);

  console.log("\n==================================================");
  if (errorCount === 0) {
    console.log("ALL VERIFICATION CHECKS PASSED (0 errors)");
  } else {
    console.error(`VERIFICATION FAILED: ${errorCount} errors detected.`);
    process.exit(1);
  }
  console.log("==================================================");

  await mongoose.disconnect();
}

runVerification().catch(err => {
  console.error("FATAL ERROR in verifyPhase3B3:", err);
  process.exit(1);
});
