// backend/src/importers/maintenance.js
// Run with: node src/importers/maintenance.js <task>
//   node src/importers/maintenance.js fixColors
//   node src/importers/maintenance.js fixTerritoryRanges
//   node src/importers/maintenance.js fixPlaceSources
//   node src/importers/maintenance.js connectRulerPlaces
//   node src/importers/maintenance.js cleanupBadRulers
//
// Merged from what used to be 5 separate one-off scripts (fixColors.js,
// fixTerritoryRanges.js, fixPlaceSources.js, connectRulerPlaces.js,
// cleanupBadRulers.js). Add new maintenance tasks as new functions below
// + a new case in the switch, rather than a new top-level file.

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../db.js";
import { wikidataUrl } from "./wikidata.js";
import Polity from "../models/Polity.js";
import Ruler from "../models/Ruler.js";
import Place from "../models/Place.js";
import Territory from "../models/Territory.js";
import Source from "../models/Source.js";

dotenv.config();

// --- fixColors: reassigns colorHex for every polity to a distinct palette ---
const COLORS = {
  "Maratha Confederacy": "#d97706",
  "Mughal Empire": "#16a34a",
  "Nizam of Hyderabad": "#9333ea",
  "Kingdom of Mysore": "#dc2626",
  "Sikh Confederacy": "#eab308",
  "Nawab of Bengal": "#0891b2",
  "Nawab of Awadh": "#db2777",
  "Jaipur State": "#c2410c",
  "Bharatpur State": "#65a30d",
  "Nawab of Carnatic": "#0d9488",
  "Kingdom of Travancore": "#be185d",
};
async function fixColors() {
  for (const [name, colorHex] of Object.entries(COLORS)) {
    const result = await Polity.updateOne({ name }, { colorHex });
    console.log(`${name}: ${result.matchedCount ? "updated" : "NOT FOUND"} -> ${colorHex}`);
  }
}

// --- fixTerritoryRanges: widens territory validFrom/validTo to cover known rulers ---
async function fixTerritoryRanges() {
  const polities = await Polity.find({});
  for (const polity of polities) {
    const rulers = await Ruler.find({ polity: polity._id });
    if (rulers.length === 0) { console.log(`${polity.name}: no rulers, skipping.`); continue; }
    const minStart = Math.min(...rulers.map((r) => r.reignStart).filter((y) => y != null));
    const maxEnd = Math.max(...rulers.map((r) => r.reignEnd).filter((y) => y != null));
    const territories = await Territory.find({ polity: polity._id });
    for (const t of territories) {
      const newFrom = Math.min(t.validFrom, minStart);
      const newTo = Math.max(t.validTo, maxEnd);
      if (newFrom !== t.validFrom || newTo !== t.validTo) {
        console.log(`${polity.name}: ${t.validFrom}-${t.validTo} -> ${newFrom}-${newTo}`);
        t.validFrom = newFrom; t.validTo = newTo; await t.save();
      } else {
        console.log(`${polity.name}: already covers ${t.validFrom}-${t.validTo}.`);
      }
    }
  }
}

// --- fixPlaceSources: attaches sources to specific places missing them ---
async function fixPlaceSources() {
  const FIXES = [
    { placeName: "Battle of Plassey site", title: "Battle of Plassey — Wikidata", qid: "Q203233" },
    { placeName: "Buxar", title: "Buxar — Wikidata", qid: "Q861160" },
  ];
  for (const fix of FIXES) {
    const place = await Place.findOne({ name: fix.placeName });
    if (!place) { console.warn(`Place "${fix.placeName}" not found.`); continue; }
    let source = await Source.findOne({ url: wikidataUrl(fix.qid) });
    if (!source) {
      source = await Source.create({ title: fix.title, type: "wikidata", url: wikidataUrl(fix.qid), notes: "Verified via findEntity.js." });
      console.log(`Created source: ${fix.title}`);
    }
    await Place.updateOne({ _id: place._id }, { $addToSet: { sources: source._id } });
    console.log(`Linked "${fix.placeName}" -> ${fix.title}`);
  }
}

// --- connectRulerPlaces: populates Ruler.places[] ---
const CURATED_EXTRA_LINKS = {
  "Jai Singh II": ["Amber Fort"],
  "Maharaja Surajmal": ["Deeg"],
  "Sawai Pratap Singh": ["Amber Fort"],
  "Robert Clive": ["Battle of Plassey site", "Siege of Arcot site"],
  "Hector Munro, 8th of Novar": ["Buxar"],
};
async function connectRulerPlaces() {
  const rulers = await Ruler.find({}).populate({ path: "polity", populate: { path: "capital" } });
  let linked = 0;
  for (const ruler of rulers) {
    const placeIds = new Set();
    if (ruler.polity?.capital) placeIds.add(ruler.polity.capital._id.toString());
    const extras = CURATED_EXTRA_LINKS[ruler.name];
    if (extras) {
      for (const placeName of extras) {
        const place = await Place.findOne({ name: placeName });
        if (place) placeIds.add(place._id.toString());
        else console.warn(`  "${placeName}" not found for ${ruler.name}.`);
      }
    }
    if (placeIds.size === 0) continue;
    await Ruler.updateOne({ _id: ruler._id }, { $addToSet: { places: { $each: Array.from(placeIds) } } });
    linked++;
  }
  console.log(`Linked places for ${linked} rulers.`);
}

// --- cleanupBadRulers: removes specific known-bad records by name ---
async function cleanupBadRulers() {
  const BAD_NAMES = ["The Shadows", "Kant-Studien"];
  for (const name of BAD_NAMES) {
    const result = await Ruler.deleteMany({ name });
    console.log(`Deleted ${result.deletedCount} record(s) named "${name}"`);
  }
}

const TASKS = { fixColors, fixTerritoryRanges, fixPlaceSources, connectRulerPlaces, cleanupBadRulers };

async function main() {
  const task = process.argv[2];
  if (!task || !TASKS[task]) {
    console.error(`Usage: node src/importers/maintenance.js <task>\nAvailable tasks: ${Object.keys(TASKS).join(", ")}`);
    process.exit(1);
  }
  await connectDB();
  await TASKS[task]();
  await mongoose.disconnect();
}

main().catch((err) => { console.error("Failed:", err); process.exit(1); });