// backend/src/importers/polities.js
// Run with: node src/importers/polities.js
//
// All non-destructive polity additions in ONE file (merged from what used
// to be addPolities.js + addPolities2.js). Extend NEW_POLITIES /
// NEW_RULERS going forward — do not create addPolities3.js.

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../db.js";
import { getEntity, getDBpediaAbstract, wikidataUrl } from "./wikidata.js";
import Polity from "../models/Polity.js";
import Place from "../models/Place.js";
import Territory from "../models/Territory.js";
import Source from "../models/Source.js";
import Ruler from "../models/Ruler.js";

dotenv.config();

const NEW_POLITIES = [
  {
    name: "Nawab of Bengal", type: "kingdom", period: { start: 1717, end: 1793 },
    colorHex: "#0891b2",
    description: "Hereditary Mughal governors of Bengal Subah who became effectively independent as Mughal central authority declined, ruling from Murshidabad until British ascendancy after Plassey (1757) and Buxar (1764).",
    capitalQid: "Q1017175", capitalType: "capital",
    territoryCoordinates: [[[84.0, 27.0], [89.5, 26.5], [89.0, 21.5], [86.0, 20.0], [83.5, 21.5], [84.0, 27.0]]],
  },
  {
    name: "Nawab of Awadh", type: "kingdom", period: { start: 1722, end: 1856 },
    colorHex: "#db2777",
    description: "Semi-autonomous Mughal governors of Awadh who became a de facto independent state as central Mughal power collapsed, ruling first from Faizabad and later Lucknow.",
    capitalName: "Lucknow",
    territoryCoordinates: [[[79.5, 29.0], [83.0, 28.5], [82.5, 25.5], [80.0, 25.0], [79.0, 27.0], [79.5, 29.0]]],
  },
  {
    name: "Jaipur State", type: "kingdom", period: { start: 1699, end: 1949 },
    colorHex: "#c2410c",
    description: "Kachwaha Rajput kingdom, capital moved from Amber to the newly founded city of Jaipur in 1727 by Sawai Jai Singh II.",
    capitalQid: "Q6124144", capitalName: "Jaipur",
    territoryCoordinates: [[[74.5, 28.0], [77.0, 27.8], [77.0, 26.0], [75.0, 25.5], [74.0, 26.5], [74.5, 28.0]]],
  },
  {
    name: "Bharatpur State", type: "kingdom", period: { start: 1724, end: 1826 },
    colorHex: "#65a30d",
    description: "Jat kingdom founded by Badan Singh and consolidated by his successor Maharaja Surajmal, centred at Bharatpur.",
    capitalQid: "Q854850", capitalName: "Bharatpur",
    territoryCoordinates: [[[76.8, 27.7], [78.0, 27.6], [78.0, 26.7], [77.0, 26.5], [76.5, 27.0], [76.8, 27.7]]],
  },
  {
    name: "Nawab of Carnatic", type: "kingdom", period: { start: 1710, end: 1855 },
    colorHex: "#0d9488",
    description: "Mughal-derived governorship of the Carnatic (coastal Tamil Nadu) that became a major regional power, deeply entangled in Anglo-French rivalry during the Carnatic Wars.",
    capitalQid: "Q589185", // Arcot
    territoryCoordinates: [[[78.5, 13.5], [80.3, 13.0], [79.8, 10.5], [78.0, 10.8], [77.8, 12.5], [78.5, 13.5]]],
  },
  {
    name: "Kingdom of Travancore", type: "kingdom", period: { start: 1729, end: 1949 },
    colorHex: "#be185d",
    description: "South Indian kingdom transformed from the small state of Venad into a major regional power under Marthanda Varma.",
    capitalQid: "Q1815867", // Padmanabhapuram
    territoryCoordinates: [[[76.3, 9.6], [77.3, 9.2], [77.2, 8.0], [76.5, 8.0], [76.1, 8.8], [76.3, 9.6]]],
  },
];

const NEW_RULERS = [
  { qid: "Q2392864", polityName: "Jaipur State", title: "Maharaja", reignStart: 1699, reignEnd: 1743 },
  { qid: "Q18663452", polityName: "Jaipur State", title: "Maharaja", reignStart: 1743, reignEnd: 1750 },
  { qid: "Q6727377", polityName: "Jaipur State", title: "Maharaja", reignStart: 1750, reignEnd: 1768 },
  { qid: "Q19282459", polityName: "Jaipur State", title: "Maharaja", reignStart: 1768, reignEnd: 1778 },
  { qid: "Q7428550", polityName: "Jaipur State", title: "Maharaja", reignStart: 1778, reignEnd: 1803 },
  { qid: "Q4840586", polityName: "Bharatpur State", title: "Maharaja", reignStart: 1724, reignEnd: 1756 },
  { qid: "Q3634691", polityName: "Bharatpur State", title: "Maharaja", reignStart: 1755, reignEnd: 1763 },
  { qid: "Q13639138", polityName: "Bharatpur State", title: "Maharaja", reignStart: 1763, reignEnd: 1768 },
  { qid: "Q7295464", polityName: "Bharatpur State", title: "Maharaja", reignStart: 1768, reignEnd: 1769 },
  { qid: "Q6383503", polityName: "Bharatpur State", title: "Maharaja", reignStart: 1769, reignEnd: 1778 },
  { qid: "Q7293177", polityName: "Bharatpur State", title: "Maharaja", reignStart: 1778, reignEnd: 1805 },
  { qid: "Q6932941", polityName: "Nawab of Carnatic", title: "Nawab", reignStart: 1749, reignEnd: 1795 },
  { qid: "Q2596305", polityName: "Kingdom of Travancore", title: "Maharaja", reignStart: 1729, reignEnd: 1758 },
  { qid: "Q5269245", polityName: "Kingdom of Travancore", title: "Maharaja", reignStart: 1758, reignEnd: 1798 },
  { qid: "Q4850086", polityName: "Kingdom of Travancore", title: "Maharaja", reignStart: 1798, reignEnd: 1810 },
];

async function run() {
  await connectDB();

  for (const entry of NEW_POLITIES) {
    console.log(`\nProcessing ${entry.name}...`);
    let capital;

    if (entry.capitalQid) {
      const entity = await getEntity(entry.capitalQid);
      if (!entity || !entity.coordinates) { console.warn(`  Could not fetch capital — skipping.`); continue; }
      const bio = await getDBpediaAbstract(entity.wikipediaTitle);
      const capitalLabel = entry.capitalName || entity.label;

      let capitalSource = await Source.findOne({ url: wikidataUrl(entry.capitalQid) });
      if (!capitalSource) {
        capitalSource = await Source.create({
          title: `${capitalLabel} — Wikidata`, type: "wikidata", url: wikidataUrl(entry.capitalQid),
          notes: "Coordinates taken from the state/place entity itself.",
        });
      }

      capital = await Place.findOne({ name: capitalLabel });
      const placeDoc = {
        name: capitalLabel, type: entry.capitalType || "capital",
        location: { type: "Point", coordinates: entity.coordinates },
        description: bio ? bio.slice(0, 400) : entity.description,
        sources: [capitalSource._id],
      };
      if (capital) await Place.updateOne({ _id: capital._id }, placeDoc);
      else capital = await Place.create(placeDoc);
      console.log(`  Capital: ${capitalLabel}`);
    } else if (entry.capitalName) {
      capital = await Place.findOne({ name: entry.capitalName });
      if (!capital) { console.warn(`  Capital "${entry.capitalName}" not found — skipping ${entry.name}.`); continue; }
      console.log(`  Capital: ${entry.capitalName} (reused existing)`);
    }

    let source = await Source.findOne({ title: `${entry.name} — Wikipedia` });
    if (!source) {
      source = await Source.create({
        title: `${entry.name} — Wikipedia`, type: "wikipedia",
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(entry.name.replace(/ /g, "_"))}`,
        notes: "General reference; territory geometry is a rough MVP approximation.",
      });
    }

    const polityDoc = {
      name: entry.name, type: entry.type, period: entry.period, capital: capital._id,
      description: entry.description, colorHex: entry.colorHex, sources: [source._id],
    };

    let polity = await Polity.findOne({ name: entry.name });
    if (polity) { await Polity.updateOne({ _id: polity._id }, polityDoc); console.log(`  Updated polity: ${entry.name}`); }
    else { polity = await Polity.create(polityDoc); console.log(`  Created polity: ${entry.name}`); }

    const existingTerritory = await Territory.findOne({ polity: polity._id });
    if (!existingTerritory) {
      await Territory.create({
        polity: polity._id, validFrom: entry.period.start, validTo: entry.period.end,
        geometry: { type: "Polygon", coordinates: entry.territoryCoordinates },
        confidence: "low", sources: [source._id],
      });
      console.log(`  Created placeholder territory (confidence: low)`);
    }
  }

  console.log(`\n--- Importing ${NEW_RULERS.length} rulers ---`);
  for (const entry of NEW_RULERS) {
    console.log(`Fetching ${entry.qid}...`);
    const entity = await getEntity(entry.qid);
    if (!entity || !entity.label) { console.warn(`  Skipped ${entry.qid} — no data.`); continue; }
    const bio = await getDBpediaAbstract(entity.wikipediaTitle);
    const polity = await Polity.findOne({ name: entry.polityName });
    if (!polity) { console.warn(`  Polity "${entry.polityName}" not found.`); continue; }

    let source = await Source.findOne({ url: wikidataUrl(entry.qid) });
    if (!source) {
      source = await Source.create({
        title: `${entity.label} — Wikidata`, type: "wikidata", url: wikidataUrl(entry.qid),
        notes: "Imported automatically via SPARQL; bio from DBpedia (CC BY-SA).",
      });
    }

    const rulerDoc = {
      name: entity.label, title: entry.title, reignStart: entry.reignStart, reignEnd: entry.reignEnd,
      birthYear: entity.birthYear, deathYear: entity.deathYear, polity: polity._id,
      imageUrl: entity.image, bio: bio ? bio.slice(0, 600) : entity.description, sources: [source._id],
    };

    try {
      const existing = await Ruler.findOne({ name: entity.label });
      if (existing) { await Ruler.updateOne({ _id: existing._id }, rulerDoc); console.log(`  Updated: ${entity.label}`); }
      else { await Ruler.create(rulerDoc); console.log(`  Created: ${entity.label}`); }
    } catch (err) { console.error(`  FAILED ${entity.label}: ${err.message}`); }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

run().catch((err) => { console.error("Failed:", err); process.exit(1); });