// backend/src/importers/validateData.js
// Run with: node src/importers/validateData.js
//
// Read-only audit — makes no changes to the database. Checks:
//   - Rulers: valid polity link (or intentionally none), plausible reign years, has a source
//   - Events: valid polity link(s), has a place, has a source
//   - Places: has coordinates, has a source
//   - Polities: has a capital, has a source
//   - Cross-check: any obviously wrong records (e.g. reignEnd < reignStart)
// Prints a report; fixes nothing automatically — bad data should be reviewed
// and corrected deliberately, not silently patched.

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../db.js";
import Ruler from "../models/Ruler.js";
import Polity from "../models/Polity.js";
import Place from "../models/Place.js";
import Event from "../models/Event.js";
import Source from "../models/Source.js";

dotenv.config();

const issues = [];
function flag(category, message) {
  issues.push({ category, message });
}

async function validate() {
  await connectDB();

  const polities = await Polity.find({});
  const polityIds = new Set(polities.map((p) => p._id.toString()));

  console.log(`\nChecking ${polities.length} polities...`);
  for (const p of polities) {
    if (!p.capital) flag("Polity", `"${p.name}" has no capital set.`);
    if (!p.sources || p.sources.length === 0) flag("Polity", `"${p.name}" has no sources.`);
  }

  const rulers = await Ruler.find({});
  console.log(`Checking ${rulers.length} rulers...`);
  for (const r of rulers) {
    if (r.polity && !polityIds.has(r.polity.toString())) {
      flag("Ruler", `"${r.name}" references a polity ID that doesn't exist.`);
    }
    if (!r.polity) {
      flag("Ruler", `"${r.name}" has no polity link (may be intentional for standalone figures).`);
    }
    if (r.reignStart != null && r.reignEnd != null && r.reignEnd < r.reignStart) {
      flag("Ruler", `"${r.name}" has reignEnd (${r.reignEnd}) before reignStart (${r.reignStart}).`);
    }
    if (!r.sources || r.sources.length === 0) {
      flag("Ruler", `"${r.name}" has no sources attached.`);
    }
    // Heuristic: names that look like they were imported wrong (very short,
    // or contain words unlikely in a historical figure's name)
    if (r.name && /journal|studien|shadows|band|magazine/i.test(r.name)) {
      flag("Ruler", `"${r.name}" — name looks suspicious, possible bad import (double-check this QID).`);
    }
  }

  const places = await Place.find({});
  console.log(`Checking ${places.length} places...`);
  for (const pl of places) {
    if (!pl.location?.coordinates || pl.location.coordinates.length !== 2) {
      flag("Place", `"${pl.name}" has missing/invalid coordinates.`);
    } else {
      const [lng, lat] = pl.location.coordinates;
      // Rough bounding box for South Asia — anything outside this for a
      // "South Asian place" is worth a second look.
      if (lng < 60 || lng > 100 || lat < 5 || lat > 38) {
        flag("Place", `"${pl.name}" has coordinates [${lng}, ${lat}] outside the expected South Asia bounding box.`);
      }
    }
    if (!pl.sources || pl.sources.length === 0) {
      flag("Place", `"${pl.name}" has no sources attached.`);
    }
    for (const polId of pl.polities || []) {
      if (!polityIds.has(polId.toString())) {
        flag("Place", `"${pl.name}" references a polity ID that doesn't exist.`);
      }
    }
  }

  const events = await Event.find({});
  console.log(`Checking ${events.length} events...`);
  for (const ev of events) {
    if (!ev.place) flag("Event", `"${ev.title}" has no place linked.`);
    if (!ev.polities || ev.polities.length === 0) {
      flag("Event", `"${ev.title}" has no polities linked.`);
    } else {
      for (const polId of ev.polities) {
        if (!polityIds.has(polId.toString())) {
          flag("Event", `"${ev.title}" references a polity ID that doesn't exist.`);
        }
      }
    }
    if (!ev.sources || ev.sources.length === 0) {
      flag("Event", `"${ev.title}" has no sources attached.`);
    }
  }

  const sourceCount = await Source.countDocuments({});
  console.log(`(${sourceCount} source records total)`);

  console.log(`\n${"=".repeat(60)}`);
  if (issues.length === 0) {
    console.log("No issues found. Data looks clean.");
  } else {
    console.log(`${issues.length} issue(s) found:\n`);
    const byCategory = {};
    issues.forEach((i) => {
      byCategory[i.category] = byCategory[i.category] || [];
      byCategory[i.category].push(i.message);
    });
    for (const [cat, msgs] of Object.entries(byCategory)) {
      console.log(`\n${cat} (${msgs.length}):`);
      msgs.forEach((m) => console.log(`  - ${m}`));
    }
  }
  console.log(`${"=".repeat(60)}\n`);

  await mongoose.disconnect();
}

validate().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});