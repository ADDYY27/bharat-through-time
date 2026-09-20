// backend/src/importers/places.js
// Run with: node src/importers/places.js
//
// All curated place imports in ONE file (merged from what used to be
// importPlaces.js + importPlaces2.js). Extend CURATED_PLACES with new
// entries going forward — do not create importPlaces3.js.

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../db.js";
import { getEntity, getDBpediaAbstract, wikidataUrl } from "./wikidata.js";
import Place from "../models/Place.js";
import Polity from "../models/Polity.js";
import Source from "../models/Source.js";

dotenv.config();

const CURATED_PLACES = [
  // --- batch 1 ---
  { qid: "Q3626515", type: "fort", polityNames: ["Maratha Confederacy"] },       // Raigad Fort
  { qid: "Q4629", type: "city", polityNames: [] },                              // Surat
  { qid: "Q48403", type: "city", polityNames: ["Sikh Confederacy"] },           // Amritsar
  { qid: "Q653988", type: "city", polityNames: ["Kingdom of Mysore"] },         // Srirangapatna
  { qid: "Q79980", type: "city", polityNames: [] },                             // Varanasi
  { qid: "Q47916", type: "city", polityNames: ["Mughal Empire"] },              // Lucknow

  // --- batch 2 ---
  { qid: "Q7131008", type: "fort", polityNames: ["Maratha Confederacy"] },              // Panhala Fort
  { qid: "Q179046", type: "monument", polityNames: ["Mughal Empire"] },                 // Fatehpur Sikri
  { qid: "Q200049", type: "city", polityNames: ["Mughal Empire"] },                     // Ajmer
  { qid: "Q17986822", type: "fort", polityNames: ["Nizam of Hyderabad"] },              // Golconda Fort
  { qid: "Q25563103", type: "city", polityNames: ["Nizam of Hyderabad"] },              // Warangal
  { qid: "Q46415", type: "fort", polityNames: ["Kingdom of Mysore"] },                  // Chitradurga
  { qid: "Q1355", type: "city", polityNames: ["Kingdom of Mysore"] },                   // Bengaluru
  { qid: "Q1354", type: "city", polityNames: ["Nawab of Bengal"] },                     // Dhaka
  { qid: "Q20099772", type: "trade_center", polityNames: ["Nawab of Bengal"] },         // Hugli-Chuchura
  { qid: "Q456817", type: "fort", polityNames: ["Jaipur State"] },                      // Amber Fort
  { qid: "Q1192807", type: "fort", polityNames: ["Bharatpur State"] },                  // Deeg
  { qid: "Q41496", type: "city", polityNames: ["Nawab of Carnatic"] },                  // Thanjavur
  { qid: "Q3390913", type: "fort", polityNames: ["Nawab of Carnatic"] },                // Vellore Fort
  { qid: "Q207754", type: "city", polityNames: ["Nawab of Carnatic"] },                 // Tiruchirappalli
  { qid: "Q589664", type: "city", polityNames: ["Sikh Confederacy"] },                  // Anandpur Sahib
  { qid: "Q167715", type: "capital", polityNames: ["Kingdom of Travancore"] },          // Thiruvananthapuram

  // --- batch 3 (Phase 3 Verified Places) ---
  { qid: "Q771105", type: "fort", polityNames: ["Mughal Empire", "Nawab of Awadh"], nameOverride: "Allahabad Fort" },
  { qid: "Q842411", type: "capital", polityNames: ["Nawab of Awadh"], nameOverride: "Faizabad" },
  { qid: "Q1348", type: "capital", polityNames: ["Nawab of Bengal"], nameOverride: "Kolkata" },
  { qid: "Q1352", type: "capital", polityNames: ["Nawab of Carnatic"], nameOverride: "Chennai" },
  { qid: "Q639421", type: "capital", polityNames: ["Nawab of Carnatic"], nameOverride: "Pondicherry" },
  { qid: "Q80989", type: "city", polityNames: ["Mughal Empire", "Maratha Confederacy"], nameOverride: "Bhopal" },
  { qid: "Q256194", type: "city", polityNames: ["Mughal Empire"], nameOverride: "Karnal" },
  { qid: "Q934153", type: "fort", polityNames: ["Maratha Confederacy", "Nizam of Hyderabad"], nameOverride: "Udgir" },
  { qid: "Q2542786", type: "trade_center", polityNames: ["Kingdom of Mysore", "Nawab of Carnatic"], nameOverride: "Parangipettai" },
  { qid: "Q127041", type: "trade_center", polityNames: ["Kingdom of Mysore"], nameOverride: "Mangaluru" },
  { qid: "Q581562", type: "capital", polityNames: ["Maratha Confederacy"], nameOverride: "Satara" },
  { qid: "Q2487545", type: "fort", polityNames: ["Maratha Confederacy", "Mughal Empire"], nameOverride: "Gwalior Fort" },
  { qid: "Q1023674", type: "capital", polityNames: ["Maratha Confederacy"], nameOverride: "Maheshwar" },
  { qid: "Q2311223", type: "battle_site", polityNames: ["Maratha Confederacy"], nameOverride: "Mahidpur" },
  { qid: "Q7259405", type: "battle_site", polityNames: ["Kingdom of Mysore", "Nawab of Carnatic"], nameOverride: "Pullalur" },
  { qid: "Q739902", type: "battle_site", polityNames: ["Maratha Confederacy"], nameOverride: "Assaye" },
  { qid: "Q2234392", type: "battle_site", polityNames: ["Maratha Confederacy"], nameOverride: "Khadki" },
  { qid: "Q15239667", type: "battle_site", polityNames: ["Maratha Confederacy"], nameOverride: "Koregaon Bhima" },
  { qid: "Q6400611", type: "fort", polityNames: ["Maratha Confederacy", "Nizam of Hyderabad"], nameOverride: "Kharda" },
  { qid: "Q29025937", type: "battle_site", polityNames: ["Maratha Confederacy"], nameOverride: "Vadgaon (Maval)" },
  { qid: "Q380144", type: "battle_site", polityNames: ["Nawab of Carnatic"], nameOverride: "Adyar" },
  { qid: "Q27963147", type: "battle_site", polityNames: ["Maratha Confederacy", "Nizam of Hyderabad"], nameOverride: "Rakshasbhuvan" },
];

async function importPlaces() {
  await connectDB();
  let created = 0, updated = 0, skipped = 0;

  for (const entry of CURATED_PLACES) {
    console.log(`Fetching ${entry.qid}...`);
    const entity = await getEntity(entry.qid);
    if (!entity || !entity.label) { console.warn(`  Skipped ${entry.qid} — no data.`); skipped++; continue; }
    if (!entity.coordinates) { console.warn(`  Skipped ${entity.label} — no coordinates.`); skipped++; continue; }

    const placeName = entry.nameOverride || entity.label;
    const bio = await getDBpediaAbstract(entity.wikipediaTitle);
    const polityIds = [];
    for (const name of entry.polityNames) {
      const polity = await Polity.findOne({ name });
      if (polity) polityIds.push(polity._id);
      else console.warn(`  Polity "${name}" not found for ${placeName}.`);
    }

    let source = await Source.findOne({ url: wikidataUrl(entry.qid) });
    if (!source) {
      source = await Source.create({
        title: `${placeName} — Wikidata`, type: "wikidata", url: wikidataUrl(entry.qid),
        notes: "Imported automatically via SPARQL; bio from DBpedia (CC BY-SA).",
      });
    }

    const placeDoc = {
      name: placeName, type: entry.type,
      location: { type: "Point", coordinates: entity.coordinates },
      description: bio ? bio.slice(0, 400) : entity.description,
      polities: polityIds, sources: [source._id],
    };

    try {
      const existing = await Place.findOne({ name: placeName });
      if (existing) { await Place.updateOne({ _id: existing._id }, placeDoc); console.log(`  Updated: ${placeName}`); updated++; }
      else { await Place.create(placeDoc); console.log(`  Created: ${placeName}`); created++; }
    } catch (err) { console.error(`  FAILED ${placeName}: ${err.message}`); skipped++; }
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

importPlaces().catch((err) => { console.error("Failed:", err); process.exit(1); });