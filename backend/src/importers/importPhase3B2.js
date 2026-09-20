// backend/src/importers/importPhase3B2.js
// Run with: node src/importers/importPhase3B2.js
//
// Phase 3B.2 — Import Verified Polities:
//   1. Sikh Empire (Q83572)
//   2. Kingdom of Marwar (Q6207845)
//   3. Kingdom of Mewar (Q17319155)
//
// Strictly respects data-safety rules:
//   - Verifies existing documents before inserting
//   - Reuses existing Lahore Place document without creating a duplicate
//   - Uses exact verified QIDs and coordinates
//   - Configures effective and weak territory representations

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../db.js";
import Polity from "../models/Polity.js";
import Place from "../models/Place.js";
import Ruler from "../models/Ruler.js";
import Territory from "../models/Territory.js";
import Source from "../models/Source.js";

dotenv.config();

const MARWAR_POLYGON = [
  [
    [71.0, 27.5],
    [74.0, 27.5],
    [74.5, 26.2],
    [73.8, 25.0],
    [72.0, 24.5],
    [70.8, 25.8],
    [71.0, 27.5],
  ],
];

const MEWAR_POLYGON = [
  [
    [73.0, 25.8],
    [75.2, 25.6],
    [75.5, 24.2],
    [74.5, 23.6],
    [73.2, 23.8],
    [72.8, 24.8],
    [73.0, 25.8],
  ],
];

const PUNJAB_POLYGON = [
  [
    [73.0, 32.5],
    [76.5, 32.5],
    [77.0, 30.0],
    [74.5, 29.0],
    [72.5, 30.5],
    [73.0, 32.5],
  ],
];

async function getOrCreateSource(title, type, url, notes = "") {
  let source = await Source.findOne({ $or: [{ url }, { title }] });
  if (!source) {
    source = await Source.create({ title, type, url, notes });
    console.log(`  [SOURCE CREATED] ${title}`);
  } else {
    console.log(`  [SOURCE REUSED] ${title}`);
  }
  return source;
}

export async function runImport() {
  await connectDB();
  console.log("=== Phase 3B.2 Import Started ===");

  const report = {
    recordsCreated: { sources: 0, polities: 0, places: 0, rulers: 0, territories: 0 },
    recordsReused: { sources: 0, places: 0, polities: 0, rulers: 0, territories: 0 },
  };

  // ─────────────────────────────────────────────────────────────
  // 1. SOURCES
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking / Creating Sources ---");
  const srcSikhWiki = await getOrCreateSource(
    "Sikh Empire — Wikipedia",
    "wikipedia",
    "https://en.wikipedia.org/wiki/Sikh_Empire",
    "General reference for the unified Sikh Empire 1799–1849."
  );
  const srcSikhWD = await getOrCreateSource(
    "Sikh Empire — Wikidata (Q83572)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q83572",
    "Verified entity Q83572; Sarkar-i-Khalsa."
  );
  const srcMarwarWiki = await getOrCreateSource(
    "Kingdom of Marwar — Wikipedia",
    "wikipedia",
    "https://en.wikipedia.org/wiki/Kingdom_of_Marwar",
    "General reference for Rathore kingdom of Marwar / Jodhpur."
  );
  const srcMarwarWD = await getOrCreateSource(
    "Kingdom of Marwar — Wikidata (Q6207845)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q6207845",
    "Verified entity Q6207845."
  );
  const srcMewarWiki = await getOrCreateSource(
    "Kingdom of Mewar — Wikipedia",
    "wikipedia",
    "https://en.wikipedia.org/wiki/Kingdom_of_Mewar",
    "General reference for Sisodia kingdom of Mewar / Udaipur."
  );
  const srcMewarWD = await getOrCreateSource(
    "Kingdom of Mewar — Wikidata (Q17319155)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q17319155",
    "Verified entity Q17319155."
  );
  const srcJodhpurWD = await getOrCreateSource(
    "Jodhpur — Wikidata (Q200019)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q200019",
    "Verified capital entity Q200019; coordinates [73.0278, 26.2944]."
  );
  const srcUdaipurWD = await getOrCreateSource(
    "Udaipur — Wikidata (Q200340)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q200340",
    "Verified capital entity Q200340; coordinates [73.6833, 24.5833]."
  );
  const srcRanjitSinghWD = await getOrCreateSource(
    "Ranjit Singh — Wikidata (Q332620)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q332620",
    "Verified entity Q332620; First Maharaja of the Sikh Empire."
  );
  const srcVijaySinghWD = await getOrCreateSource(
    "Vijay Singh of Marwar — Wikidata (Q17495974)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q17495974",
    "Verified entity Q17495974; Maharaja of Marwar."
  );
  const srcManSinghWD = await getOrCreateSource(
    "Man Singh of Marwar — Wikidata (Q17495687)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q17495687",
    "Verified entity Q17495687; Maharaja of Marwar."
  );
  const srcAriSinghWD = await getOrCreateSource(
    "Ari Singh II — Wikidata (Q12449436)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q12449436",
    "Verified entity Q12449436; Maharana of Mewar."
  );
  const srcBhimSinghWD = await getOrCreateSource(
    "Bhim Singh of Mewar — Wikidata (Q12446060)",
    "wikidata",
    "https://www.wikidata.org/wiki/Q12446060",
    "Verified entity Q12446060; Maharana of Mewar."
  );

  // ─────────────────────────────────────────────────────────────
  // 2. PLACES (REUSING LAHORE, CREATING JODHPUR & UDAIPUR)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking / Creating Places ---");

  // Lahore: MUST reuse existing
  let lahore = await Place.findOne({ name: "Lahore" });
  if (!lahore) {
    throw new Error("Safety check failed: Expected existing Lahore place not found in database!");
  }
  console.log(`  [PLACE REUSED] Lahore (id: ${lahore._id})`);
  report.recordsReused.places++;

  // Jodhpur: create if not exists
  let jodhpur = await Place.findOne({ name: "Jodhpur" });
  if (!jodhpur) {
    jodhpur = await Place.create({
      name: "Jodhpur",
      type: "capital",
      location: { type: "Point", coordinates: [73.0278, 26.2944] },
      modernState: "Rajasthan",
      description: "Historic capital of the Rathore kingdom of Marwar, founded in 1459 by Rao Jodha beneath the Mehrangarh Fort.",
      sources: [srcJodhpurWD._id, srcMarwarWiki._id],
    });
    console.log(`  [PLACE CREATED] Jodhpur (id: ${jodhpur._id})`);
    report.recordsCreated.places++;
  } else {
    console.log(`  [PLACE REUSED] Jodhpur (id: ${jodhpur._id})`);
    report.recordsReused.places++;
  }

  // Udaipur: create if not exists
  let udaipur = await Place.findOne({ name: "Udaipur" });
  if (!udaipur) {
    udaipur = await Place.create({
      name: "Udaipur",
      type: "capital",
      location: { type: "Point", coordinates: [73.6833, 24.5833] },
      modernState: "Rajasthan",
      description: "Historic capital of the Sisodia kingdom of Mewar, founded in 1559 by Maharana Udai Singh II in the Aravalli hills.",
      sources: [srcUdaipurWD._id, srcMewarWiki._id],
    });
    console.log(`  [PLACE CREATED] Udaipur (id: ${udaipur._id})`);
    report.recordsCreated.places++;
  } else {
    console.log(`  [PLACE REUSED] Udaipur (id: ${udaipur._id})`);
    report.recordsReused.places++;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. POLITIES
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking / Creating Polities ---");

  // Sikh Empire (Q83572)
  let sikhEmpire = await Polity.findOne({ name: "Sikh Empire" });
  if (!sikhEmpire) {
    sikhEmpire = await Polity.create({
      name: "Sikh Empire",
      type: "empire",
      period: { start: 1799, end: 1849 },
      capital: lahore._id,
      colorHex: "#d97706",
      description: "Centralized imperial monarchy founded by Maharaja Ranjit Singh, unifying the autonomous misls of the Punjab with its capital at Lahore until British annexation in 1849.",
      sources: [srcSikhWiki._id, srcSikhWD._id],
    });
    console.log(`  [POLITY CREATED] Sikh Empire (id: ${sikhEmpire._id})`);
    report.recordsCreated.polities++;
  } else {
    console.log(`  [POLITY REUSED] Sikh Empire (id: ${sikhEmpire._id})`);
    report.recordsReused.polities++;
  }

  // Kingdom of Marwar (Q6207845)
  let marwar = await Polity.findOne({ name: "Kingdom of Marwar" });
  if (!marwar) {
    marwar = await Polity.create({
      name: "Kingdom of Marwar",
      type: "kingdom",
      period: { start: 1700, end: 1818 },
      capital: jodhpur._id,
      colorHex: "#e11d48",
      description: "Rathore Rajput kingdom centred at Jodhpur in western Rajasthan, which played a pivotal role in Rajputana politics, Maratha wars, and the 1818 British subsidiary alliance.",
      sources: [srcMarwarWiki._id, srcMarwarWD._id],
    });
    console.log(`  [POLITY CREATED] Kingdom of Marwar (id: ${marwar._id})`);
    report.recordsCreated.polities++;
  } else {
    console.log(`  [POLITY REUSED] Kingdom of Marwar (id: ${marwar._id})`);
    report.recordsReused.polities++;
  }

  // Kingdom of Mewar (Q17319155)
  let mewar = await Polity.findOne({ name: "Kingdom of Mewar" });
  if (!mewar) {
    mewar = await Polity.create({
      name: "Kingdom of Mewar",
      type: "kingdom",
      period: { start: 1700, end: 1818 },
      capital: udaipur._id,
      colorHex: "#991b1b",
      description: "Sisodia Rajput kingdom in southern Rajasthan, renowned for its centuries of independence and resistance, ruling from Udaipur through the Maratha wars to the 1818 British treaty.",
      sources: [srcMewarWiki._id, srcMewarWD._id],
    });
    console.log(`  [POLITY CREATED] Kingdom of Mewar (id: ${mewar._id})`);
    report.recordsCreated.polities++;
  } else {
    console.log(`  [POLITY REUSED] Kingdom of Mewar (id: ${mewar._id})`);
    report.recordsReused.polities++;
  }

  // Link capitals to their polities
  await Place.updateOne(
    { _id: lahore._id },
    { $addToSet: { polities: sikhEmpire._id } }
  );
  await Place.updateOne(
    { _id: jodhpur._id },
    { $addToSet: { polities: marwar._id } }
  );
  await Place.updateOne(
    { _id: udaipur._id },
    { $addToSet: { polities: mewar._id } }
  );
  console.log("  Capitals' polity associations updated.");

  // ─────────────────────────────────────────────────────────────
  // 4. TERRITORIES
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking / Creating Territories ---");

  // Sikh Empire: 1799–1820, effective
  let tSikh = await Territory.findOne({
    polity: sikhEmpire._id,
    validFrom: 1799,
    validTo: 1820,
  });
  if (!tSikh) {
    tSikh = await Territory.create({
      polity: sikhEmpire._id,
      validFrom: 1799,
      validTo: 1820,
      geometry: { type: "Polygon", coordinates: PUNJAB_POLYGON },
      confidence: "low",
      representation: "effective",
      sources: [srcSikhWiki._id],
    });
    console.log(`  [TERRITORY CREATED] Sikh Empire (1799–1820, effective)`);
    report.recordsCreated.territories++;
  } else {
    console.log(`  [TERRITORY REUSED] Sikh Empire (1799–1820, effective)`);
    report.recordsReused.territories++;
  }

  // Kingdom of Marwar: 1700–1790 (effective), 1791–1818 (weak)
  let tMarwarEff = await Territory.findOne({
    polity: marwar._id,
    validFrom: 1700,
    validTo: 1790,
  });
  if (!tMarwarEff) {
    tMarwarEff = await Territory.create({
      polity: marwar._id,
      validFrom: 1700,
      validTo: 1790,
      geometry: { type: "Polygon", coordinates: MARWAR_POLYGON },
      confidence: "low",
      representation: "effective",
      sources: [srcMarwarWiki._id],
    });
    console.log(`  [TERRITORY CREATED] Kingdom of Marwar (1700–1790, effective)`);
    report.recordsCreated.territories++;
  } else {
    console.log(`  [TERRITORY REUSED] Kingdom of Marwar (1700–1790, effective)`);
    report.recordsReused.territories++;
  }

  let tMarwarWeak = await Territory.findOne({
    polity: marwar._id,
    validFrom: 1791,
    validTo: 1818,
  });
  if (!tMarwarWeak) {
    tMarwarWeak = await Territory.create({
      polity: marwar._id,
      validFrom: 1791,
      validTo: 1818,
      geometry: { type: "Polygon", coordinates: MARWAR_POLYGON },
      confidence: "low",
      representation: "weak",
      sources: [srcMarwarWiki._id],
    });
    console.log(`  [TERRITORY CREATED] Kingdom of Marwar (1791–1818, weak)`);
    report.recordsCreated.territories++;
  } else {
    console.log(`  [TERRITORY REUSED] Kingdom of Marwar (1791–1818, weak)`);
    report.recordsReused.territories++;
  }

  // Kingdom of Mewar: 1700–1769 (effective), 1770–1818 (weak)
  let tMewarEff = await Territory.findOne({
    polity: mewar._id,
    validFrom: 1700,
    validTo: 1769,
  });
  if (!tMewarEff) {
    tMewarEff = await Territory.create({
      polity: mewar._id,
      validFrom: 1700,
      validTo: 1769,
      geometry: { type: "Polygon", coordinates: MEWAR_POLYGON },
      confidence: "low",
      representation: "effective",
      sources: [srcMewarWiki._id],
    });
    console.log(`  [TERRITORY CREATED] Kingdom of Mewar (1700–1769, effective)`);
    report.recordsCreated.territories++;
  } else {
    console.log(`  [TERRITORY REUSED] Kingdom of Mewar (1700–1769, effective)`);
    report.recordsReused.territories++;
  }

  let tMewarWeak = await Territory.findOne({
    polity: mewar._id,
    validFrom: 1770,
    validTo: 1818,
  });
  if (!tMewarWeak) {
    tMewarWeak = await Territory.create({
      polity: mewar._id,
      validFrom: 1770,
      validTo: 1818,
      geometry: { type: "Polygon", coordinates: MEWAR_POLYGON },
      confidence: "low",
      representation: "weak",
      sources: [srcMewarWiki._id],
    });
    console.log(`  [TERRITORY CREATED] Kingdom of Mewar (1770–1818, weak)`);
    report.recordsCreated.territories++;
  } else {
    console.log(`  [TERRITORY REUSED] Kingdom of Mewar (1770–1818, weak)`);
    report.recordsReused.territories++;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. RULERS
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- Checking / Creating Rulers ---");

  const RULERS_DATA = [
    {
      name: "Ranjit Singh",
      title: "Maharaja",
      dynasty: "Sukerchakia Misl",
      reignStart: 1799,
      reignEnd: 1839,
      birthYear: 1780,
      deathYear: 1839,
      polity: sikhEmpire._id,
      places: [lahore._id],
      imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Maharaj%20Ranjit%20Singh.jpg",
      bio: "Founder and first Maharaja of the Sikh Empire (Sher-e-Punjab) who captured Lahore in 1799, was crowned in 1801, and forged a unified empire across the Punjab and northwest frontiers.",
      sources: [srcRanjitSinghWD._id],
    },
    {
      name: "Vijay Singh of Marwar",
      title: "Maharaja",
      dynasty: "Rathore",
      reignStart: 1752,
      reignEnd: 1793,
      birthYear: 1729,
      deathYear: 1793,
      polity: marwar._id,
      places: [jodhpur._id],
      imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Vijay%20Singh%20of%20Marwar.jpg",
      bio: "Maharaja of Marwar who ruled during fierce Maratha conflicts, notably the Battle of Tunga (1787) and Battle of Merta (1790) against Mahadaji Scindia.",
      sources: [srcVijaySinghWD._id],
    },
    {
      name: "Man Singh of Marwar",
      title: "Maharaja",
      dynasty: "Rathore",
      reignStart: 1803,
      reignEnd: 1843,
      birthYear: 1783,
      deathYear: 1843,
      polity: marwar._id,
      places: [jodhpur._id],
      imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Man%20Singh%20of%20Marwar.jpg",
      bio: "Maharaja of Marwar who sheltered Yashwantrao Holkar in 1805, was a principal in the Krishna Kumari dispute, and concluded the 1818 subsidiary alliance treaty with the British East India Company.",
      sources: [srcManSinghWD._id],
    },
    {
      name: "Ari Singh II",
      title: "Maharana",
      dynasty: "Sisodia",
      reignStart: 1761,
      reignEnd: 1773,
      birthYear: null,
      deathYear: 1773,
      polity: mewar._id,
      places: [udaipur._id],
      imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Mewar%20Maharana%20Ari%20Singh.jpg",
      bio: "Maharana of Mewar whose disputed accession precipitated Maratha armed intervention and the 1769 siege of Udaipur by Mahadaji Scindia.",
      sources: [srcAriSinghWD._id],
    },
    {
      name: "Bhim Singh of Mewar",
      title: "Maharana",
      dynasty: "Sisodia",
      reignStart: 1778,
      reignEnd: 1828,
      birthYear: 1768,
      deathYear: 1828,
      polity: mewar._id,
      places: [udaipur._id],
      imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Bhim%20Singh%20of%20Mewar.jpg",
      bio: "Maharana of Mewar for fifty years through Maratha incursions, the tragic Krishna Kumari crisis (1810), and the restoration of stability via the 1818 British alliance treaty with Col. James Tod.",
      sources: [srcBhimSinghWD._id],
    },
  ];

  for (const rData of RULERS_DATA) {
    let ruler = await Ruler.findOne({ name: rData.name });
    if (!ruler) {
      ruler = await Ruler.create(rData);
      console.log(`  [RULER CREATED] ${rData.name} (id: ${ruler._id})`);
      report.recordsCreated.rulers++;
    } else {
      await Ruler.updateOne({ _id: ruler._id }, rData);
      console.log(`  [RULER UPDATED/REUSED] ${rData.name} (id: ${ruler._id})`);
      report.recordsReused.rulers++;
    }
  }

  console.log("\n=== Phase 3B.2 Import Completed Successfully ===");
  console.log("Summary:", JSON.stringify(report, null, 2));

  await mongoose.disconnect();
  return report;
}

if (process.argv[1] && process.argv[1].endsWith("importPhase3B2.js")) {
  runImport().catch((err) => {
    console.error("Phase 3B.2 Import Failed:", err);
    process.exit(1);
  });
}
