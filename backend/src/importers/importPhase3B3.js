// backend/src/importers/importPhase3B3.js
// Run with: node src/importers/importPhase3B3.js
//
// Phase 3B.3 — Import Verified Historical Events:
//   1. Battle of Tunga / Lalsot — Q4871529 — 28 July 1787
//   2. Battle of Merta — Q22935930 — 10 September 1790
//   3. Treaty of Amritsar — Q17035527 — 25 April 1809
//   4. Treaty of Jodhpur / Marwar Subsidiary Alliance — 6 January 1818
//   5. Treaty of Udaipur / Mewar Subsidiary Alliance — 13 January 1818
//
// Strictly respects data-safety rules:
//   - Verifies existing documents before inserting
//   - Reuses existing Amritsar, Jodhpur, Udaipur places without creating duplicates
//   - Creates only verified Merta City and Lalsot places
//   - Links exact verified polities and rulers
//   - Does NOT import Hurda Conference

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../db.js";
import Polity from "../models/Polity.js";
import Place from "../models/Place.js";
import Ruler from "../models/Ruler.js";
import Event from "../models/Event.js";
import Source from "../models/Source.js";

dotenv.config();

async function getOrCreateSource(title, type, url, notes, extra = {}) {
  let source = await Source.findOne({ title });
  if (!source && url) {
    source = await Source.findOne({ url });
  }
  if (!source) {
    source = await Source.create({
      title,
      type: type || "other",
      url,
      notes,
      ...extra,
    });
  }
  return source;
}

async function run() {
  console.log("==================================================");
  console.log("Phase 3B.3 — Import Verified Historical Events");
  console.log("==================================================");

  await connectDB();

  const report = {
    recordsCreated: { places: 0, events: 0, sources: 0 },
    recordsReused: { places: 0, polities: 0, rulers: 0, events: 0, sources: 0 },
  };

  // ─────────────────────────────────────────────────────────────
  // 1. SOURCES
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking / Creating Sources ---");

  // Place Sources
  const srcMertaWD = await getOrCreateSource(
    "Merta City — Wikidata (Q2544240)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q2544240",
    "Verified entity Q2544240; historic city in Nagaur district, Rajasthan, site of the 1790 Battle of Merta."
  );

  const srcLalsotWD = await getOrCreateSource(
    "Lalsot — Wikidata (Q2229760)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q2229760",
    "Verified entity Q2229760; historic town in Dausa district, Rajasthan, site of the 1787 Battle of Tunga/Lalsot."
  );

  // Event Sources
  const srcTungaWD = await getOrCreateSource(
    "Battle of Lalsot — Wikidata (Q4871529)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q4871529",
    "Verified entity Q4871529; fought 28 July 1787 between Maratha army under Mahadaji Scindia and Jaipur-Marwar Rajput coalition."
  );

  const srcSarkarVol3 = await getOrCreateSource(
    "Fall of the Mughal Empire, Vol. 3 (1771–1788)",
    "book",
    null,
    "Military campaign analysis of the Battle of Tunga / Lalsot (July 1787) between Mahadaji Scindia and the Rajput confederacy.",
    { author: "Jadunath Sarkar", year: 1964, publisher: "Orient Longman" }
  );

  const srcMertaEventWD = await getOrCreateSource(
    "Battle of Merta — Wikidata (Q22935930)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q22935930",
    "Verified entity Q22935930; fought 10 September 1790 between Maratha army under Benoît de Boigne and Rathores of Marwar."
  );

  const srcSarkarVol4 = await getOrCreateSource(
    "Fall of the Mughal Empire, Vol. 4 (1789–1803)",
    "book",
    null,
    "Comprehensive account of the Battle of Merta (Sept 1790) and resultant surrender of Ajmer by Marwar.",
    { author: "Jadunath Sarkar", year: 1972, publisher: "Orient Longman" }
  );

  const srcAmritsarWD = await getOrCreateSource(
    "Treaty of Amritsar in 1809 — Wikidata (Q17035527)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q17035527",
    "Verified entity Q17035527; treaty between Maharaja Ranjit Singh and British East India Company establishing the Sutlej boundary."
  );

  const srcGrewalSikhs = await getOrCreateSource(
    "The Sikhs of the Punjab (New Cambridge History of India)",
    "book",
    null,
    "Historical analysis of the Treaty of Amritsar (1809) and Maharaja Ranjit Singh's regional consolidation.",
    { author: "J.S. Grewal", year: 1990, publisher: "Cambridge University Press" }
  );

  const srcAitchisonMarwar = await getOrCreateSource(
    "Treaty with the Raja of Jodhpore (1818) — Aitchison",
    "book",
    null,
    "A Collection of Treaties, Engagements and Sanads Relating to India, Vol. III: Rajputana Agency, Treaty of 6 January 1818 with Maharaja Man Singh.",
    { author: "C.U. Aitchison", year: 1932, publisher: "Government of India Central Publication Branch" }
  );

  const srcAitchisonMewar = await getOrCreateSource(
    "Treaty with the Maharana of Oudeypore (1818) — Aitchison",
    "book",
    null,
    "A Collection of Treaties, Engagements and Sanads Relating to India, Vol. III: Rajputana Agency, Treaty of 13 January 1818 with Maharana Bhim Singh.",
    { author: "C.U. Aitchison", year: 1932, publisher: "Government of India Central Publication Branch" }
  );

  console.log("  Sources checked/ready.");

  // ─────────────────────────────────────────────────────────────
  // 2. POLITIES CHECK
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking Polities ---");

  const maratha = await Polity.findOne({ name: "Maratha Confederacy" });
  if (!maratha) throw new Error("Safety check failed: Maratha Confederacy not found!");
  console.log(`  [POLITY REUSED] Maratha Confederacy (${maratha._id})`);
  report.recordsReused.polities++;

  const marwar = await Polity.findOne({ name: "Kingdom of Marwar" });
  if (!marwar) throw new Error("Safety check failed: Kingdom of Marwar not found!");
  console.log(`  [POLITY REUSED] Kingdom of Marwar (${marwar._id})`);
  report.recordsReused.polities++;

  const jaipur = await Polity.findOne({ name: "Jaipur State" });
  if (!jaipur) throw new Error("Safety check failed: Jaipur State not found!");
  console.log(`  [POLITY REUSED] Jaipur State (${jaipur._id})`);
  report.recordsReused.polities++;

  const sikhEmpire = await Polity.findOne({ name: "Sikh Empire" });
  if (!sikhEmpire) throw new Error("Safety check failed: Sikh Empire not found!");
  console.log(`  [POLITY REUSED] Sikh Empire (${sikhEmpire._id})`);
  report.recordsReused.polities++;

  const mewar = await Polity.findOne({ name: "Kingdom of Mewar" });
  if (!mewar) throw new Error("Safety check failed: Kingdom of Mewar not found!");
  console.log(`  [POLITY REUSED] Kingdom of Mewar (${mewar._id})`);
  report.recordsReused.polities++;

  // ─────────────────────────────────────────────────────────────
  // 3. RULERS CHECK
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking Rulers ---");

  const vijaySingh = await Ruler.findOne({ name: "Vijay Singh of Marwar" });
  if (!vijaySingh) throw new Error("Safety check failed: Vijay Singh of Marwar not found!");
  console.log(`  [RULER REUSED] Vijay Singh of Marwar (${vijaySingh._id})`);
  report.recordsReused.rulers++;

  const sawaiPratap = await Ruler.findOne({ name: "Sawai Pratap Singh" });
  if (!sawaiPratap) throw new Error("Safety check failed: Sawai Pratap Singh not found!");
  console.log(`  [RULER REUSED] Sawai Pratap Singh (${sawaiPratap._id})`);
  report.recordsReused.rulers++;

  const madhavraoII = await Ruler.findOne({ name: "Madhavrao II" });
  if (!madhavraoII) throw new Error("Safety check failed: Madhavrao II not found!");
  console.log(`  [RULER REUSED] Madhavrao II (${madhavraoII._id})`);
  report.recordsReused.rulers++;

  const ranjitSingh = await Ruler.findOne({ name: "Ranjit Singh", polity: sikhEmpire._id });
  if (!ranjitSingh) throw new Error("Safety check failed: Ranjit Singh (Sikh Empire) not found!");
  console.log(`  [RULER REUSED] Ranjit Singh (${ranjitSingh._id})`);
  report.recordsReused.rulers++;

  const manSingh = await Ruler.findOne({ name: "Man Singh of Marwar" });
  if (!manSingh) throw new Error("Safety check failed: Man Singh of Marwar not found!");
  console.log(`  [RULER REUSED] Man Singh of Marwar (${manSingh._id})`);
  report.recordsReused.rulers++;

  const bhimSingh = await Ruler.findOne({ name: "Bhim Singh of Mewar" });
  if (!bhimSingh) throw new Error("Safety check failed: Bhim Singh of Mewar not found!");
  console.log(`  [RULER REUSED] Bhim Singh of Mewar (${bhimSingh._id})`);
  report.recordsReused.rulers++;

  // ─────────────────────────────────────────────────────────────
  // 4. PLACES (REUSING AMRITSAR, JODHPUR, UDAIPUR; CREATING MERTA, LALSOT)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking / Creating Places ---");

  // Amritsar: MUST reuse existing
  const amritsar = await Place.findOne({ name: "Amritsar" });
  if (!amritsar) throw new Error("Safety check failed: Existing Amritsar place not found!");
  console.log(`  [PLACE REUSED] Amritsar (${amritsar._id})`);
  report.recordsReused.places++;

  // Jodhpur: MUST reuse existing
  const jodhpur = await Place.findOne({ name: "Jodhpur" });
  if (!jodhpur) throw new Error("Safety check failed: Existing Jodhpur place not found!");
  console.log(`  [PLACE REUSED] Jodhpur (${jodhpur._id})`);
  report.recordsReused.places++;

  // Udaipur: MUST reuse existing
  const udaipur = await Place.findOne({ name: "Udaipur" });
  if (!udaipur) throw new Error("Safety check failed: Existing Udaipur place not found!");
  console.log(`  [PLACE REUSED] Udaipur (${udaipur._id})`);
  report.recordsReused.places++;

  // Merta City: create if not exists
  let mertaCity = await Place.findOne({ name: { $in: ["Merta City", "Merta"] } });
  if (!mertaCity) {
    mertaCity = await Place.create({
      name: "Merta City",
      type: "city",
      location: { type: "Point", coordinates: [74.0333, 26.65] },
      modernState: "Rajasthan",
      description: "Historic fortified city in Nagaur district, Rajasthan; strategic trade crossroad and site of the decisive 1790 Battle of Merta.",
      polities: [marwar._id],
      sources: [srcMertaWD._id, srcSarkarVol4._id],
    });
    console.log(`  [PLACE CREATED] Merta City (${mertaCity._id})`);
    report.recordsCreated.places++;
  } else {
    console.log(`  [PLACE REUSED] Merta City (${mertaCity._id})`);
    report.recordsReused.places++;
  }

  // Lalsot: create if not exists
  let lalsot = await Place.findOne({ name: { $in: ["Lalsot", "Tunga"] } });
  if (!lalsot) {
    lalsot = await Place.create({
      name: "Lalsot",
      type: "city",
      location: { type: "Point", coordinates: [76.33, 26.57] },
      modernState: "Rajasthan",
      description: "Historic town in Dausa district, Rajasthan; site of the 1787 Battle of Tunga/Lalsot between the Rajput coalition and Mahadaji Scindia.",
      polities: [jaipur._id, marwar._id],
      sources: [srcLalsotWD._id, srcSarkarVol3._id],
    });
    console.log(`  [PLACE CREATED] Lalsot (${lalsot._id})`);
    report.recordsCreated.places++;
  } else {
    console.log(`  [PLACE REUSED] Lalsot (${lalsot._id})`);
    report.recordsReused.places++;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. EVENTS IMPORT
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking / Creating Events ---");

  const EVENTS_TO_IMPORT = [
    {
      title: "Battle of Tunga / Lalsot",
      type: "battle",
      year: 1787,
      description: "Fought on 28 July 1787 near Tunga and Lalsot between the combined Rajput armies of Jaipur (under Sawai Pratap Singh) and Marwar (under Vijay Singh) against the Maratha army led by Mahadaji Scindia. The united Rajput front successfully checked Scindia's advance, forcing the Marathas to fall back toward Alwar.",
      outcome: "Rajput tactical victory; checked Mahadaji Scindia's territorial expansion in eastern Rajasthan and forced a temporary Maratha retreat.",
      place: lalsot._id,
      polities: [maratha._id, marwar._id, jaipur._id],
      rulers: [vijaySingh._id, sawaiPratap._id, madhavraoII._id],
      sources: [srcTungaWD._id, srcSarkarVol3._id],
    },
    {
      title: "Battle of Merta",
      type: "battle",
      year: 1790,
      description: "Fought on 10 September 1790 at Merta between the Maratha army under General Benoît de Boigne (serving Mahadaji Scindia) and the Rathore cavalry of Marwar under Maharaja Vijay Singh. De Boigne's European-drilled infantry and concentrated artillery decisively defeated the Rathores, forcing Marwar to surrender Ajmer and pay a heavy indemnity.",
      outcome: "Decisive Maratha victory. Kingdom of Marwar was compelled to surrender the strategic fortress of Ajmer, pay 60 lakh rupees in war tribute, and accept subordinate Maratha influence.",
      place: mertaCity._id,
      polities: [maratha._id, marwar._id],
      rulers: [vijaySingh._id, madhavraoII._id],
      sources: [srcMertaEventWD._id, srcSarkarVol4._id],
    },
    {
      title: "Treaty of Amritsar",
      type: "treaty",
      year: 1809,
      description: "Concluded on 25 April 1809 between Maharaja Ranjit Singh of the Sikh Empire and Charles T. Metcalfe representing the British East India Company. The treaty established the Sutlej River as the permanent mutual boundary, guaranteeing British protection to the Cis-Sutlej Sikh states while leaving Ranjit Singh free to consolidate and expand across the trans-Sutlej Punjab, Multan, and Kashmir.",
      outcome: "Mutual demarcation; fixed the Sutlej River as the southeastern boundary of the Sikh Empire, enabling Ranjit Singh to direct his expansion northward and westward.",
      place: amritsar._id,
      polities: [sikhEmpire._id],
      rulers: [ranjitSingh._id],
      sources: [srcAmritsarWD._id, srcGrewalSikhs._id],
    },
    {
      title: "Treaty of Jodhpur / Marwar Subsidiary Alliance",
      type: "treaty",
      year: 1818,
      description: "Concluded on 6 January 1818 between Maharaja Man Singh of Marwar and the British East India Company (ratified by the Governor-General Lord Hastings). The treaty brought the Kingdom of Marwar into a subsidiary alliance, surrendering control over foreign policy in return for British military protection and guaranteeing internal dynastic succession.",
      outcome: "Marwar became a British princely state under subsidiary alliance, terminating its sovereign geopolitical autonomy while preserving Rathore dynastic rule.",
      place: jodhpur._id,
      polities: [marwar._id],
      rulers: [manSingh._id],
      sources: [srcAitchisonMarwar._id],
    },
    {
      title: "Treaty of Udaipur / Mewar Subsidiary Alliance",
      type: "treaty",
      year: 1818,
      description: "Concluded on 13 January 1818 between Maharana Bhim Singh of Mewar and Charles Metcalfe on behalf of the British East India Company. Following decades of devastating Maratha tribute collections and Pindari raids, the treaty placed Mewar under British protection, restored confiscated crown lands, and settled administrative affairs through the British resident Col. James Tod.",
      outcome: "Mewar entered into a perpetual subsidiary alliance with the British East India Company, ending decades of Maratha and Pindari exactions.",
      place: udaipur._id,
      polities: [mewar._id],
      rulers: [bhimSingh._id],
      sources: [srcAitchisonMewar._id],
    },
  ];

  for (const ev of EVENTS_TO_IMPORT) {
    let existing = await Event.findOne({
      $or: [
        { title: ev.title },
        { title: new RegExp(`^${ev.title.split("/")[0].trim()}`, "i") }
      ]
    });

    if (existing) {
      await Event.updateOne({ _id: existing._id }, ev);
      console.log(`  [EVENT REUSED/UPDATED] ${ev.title} (${existing._id})`);
      report.recordsReused.events++;
    } else {
      const created = await Event.create(ev);
      console.log(`  [EVENT CREATED] ${ev.title} (${created._id})`);
      report.recordsCreated.events++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. FINAL SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log("\n==================================================");
  console.log("Phase 3B.3 Import Completed Successfully");
  console.log("==================================================");
  console.log("Summary of operations:");
  console.log("  Places Created:", report.recordsCreated.places);
  console.log("  Places Reused: ", report.recordsReused.places);
  console.log("  Events Created:", report.recordsCreated.events);
  console.log("  Events Reused: ", report.recordsReused.events);
  console.log("  Polities Linked:", report.recordsReused.polities);
  console.log("  Rulers Linked:  ", report.recordsReused.rulers);

  const counts = {
    polities: await Polity.countDocuments(),
    places: await Place.countDocuments(),
    rulers: await Ruler.countDocuments(),
    territories: await mongoose.connection.db.collection("territories").countDocuments(),
    events: await Event.countDocuments(),
    sources: await Source.countDocuments(),
  };
  console.log("\nLive Database Counts:", JSON.stringify(counts, null, 2));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("FATAL ERROR in importPhase3B3:", err);
  process.exit(1);
});
