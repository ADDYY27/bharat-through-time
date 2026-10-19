import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/db.js";
import NarratedStory from "../src/models/NarratedStory.js";
import Place from "../src/models/Place.js";
import Ruler from "../src/models/Ruler.js";
import Polity from "../src/models/Polity.js";
import Event from "../src/models/Event.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root if not already set
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function resolveEntities(links = {}) {
  const resolved = {
    places: [],
    people: [],
    polities: [],
    events: [],
  };

  // 1. Places
  if (Array.isArray(links.places)) {
    for (const item of links.places) {
      const name = typeof item === "string" ? item : item.name;
      const qid = typeof item === "object" && item.qid ? item.qid : null;
      let entityId = null;
      if (name) {
        const found = await Place.findOne({
          name: new RegExp(`^${name.trim()}$`, "i"),
        });
        if (found) entityId = found._id;
      }
      resolved.places.push({ name, entityId, qid });
    }
  }

  // 2. People (Rulers / Historical Figures)
  if (Array.isArray(links.people)) {
    for (const item of links.people) {
      const name = typeof item === "string" ? item : item.name;
      const qid = typeof item === "object" && item.qid ? item.qid : null;
      let entityId = null;
      if (name) {
        const found = await Ruler.findOne({
          name: new RegExp(`^${name.trim()}$`, "i"),
        });
        if (found) entityId = found._id;
      }
      resolved.people.push({ name, entityId, qid });
    }
  }

  // 3. Polities
  if (Array.isArray(links.polities)) {
    for (const item of links.polities) {
      const name = typeof item === "string" ? item : item.name;
      const qid = typeof item === "object" && item.qid ? item.qid : null;
      let entityId = null;
      if (name) {
        const found = await Polity.findOne({
          name: new RegExp(`^${name.trim()}$`, "i"),
        });
        if (found) entityId = found._id;
      }
      resolved.polities.push({ name, entityId, qid });
    }
  }

  // 4. Events
  if (Array.isArray(links.events)) {
    for (const item of links.events) {
      const name = typeof item === "string" ? item : item.name;
      const qid = typeof item === "object" && item.qid ? item.qid : null;
      let entityId = null;
      if (name) {
        const found = await Event.findOne({
          title: new RegExp(`^${name.trim()}$`, "i"),
        });
        if (found) entityId = found._id;
      }
      resolved.events.push({ name, entityId, qid });
    }
  }

  return resolved;
}

export async function importStories() {
  await connectDB();

  // Find data directory
  const candidateDirs = [
    path.resolve(__dirname, "../../data/stories"),
    path.resolve(process.cwd(), "data/stories"),
    path.resolve(process.cwd(), "../data/stories"),
  ];

  let storiesDir = candidateDirs.find((d) => fs.existsSync(d));

  if (!storiesDir) {
    console.error("Could not find data/stories directory. Tried:", candidateDirs);
    process.exit(1);
  }

  console.log(`Reading stories from: ${storiesDir}`);
  const files = fs.readdirSync(storiesDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.warn("No story JSON files found in directory.");
    return { created: 0, updated: 0, skipped: 0, failed: 0 };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(storiesDir, file);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const storyData = JSON.parse(raw);

      if (!storyData.slug || !storyData.title || !storyData.category) {
        console.warn(`[SKIP] ${file}: Missing required fields (slug, title, category)`);
        skipped++;
        continue;
      }

      // Compute onMap
      const startYear = storyData.period?.startYear;
      const endYear = storyData.period?.endYear;
      const onMap =
        typeof startYear === "number" && typeof endYear === "number"
          ? startYear <= 1820 && endYear >= 1700
          : false;

      // Resolve linked entities against DB
      const resolvedLinks = await resolveEntities(storyData.links || {});

      const payload = {
        ...storyData,
        links: resolvedLinks,
        onMap,
      };

      const existing = await NarratedStory.findOne({ slug: storyData.slug });
      if (existing) {
        await NarratedStory.updateOne({ slug: storyData.slug }, { $set: payload });
        console.log(`[UPDATE] ${storyData.slug} (${storyData.status || "draft"})`);
        updated++;
      } else {
        await NarratedStory.create(payload);
        console.log(`[CREATE] ${storyData.slug} (${storyData.status || "draft"})`);
        created++;
      }
    } catch (err) {
      console.error(`[ERROR] Failed to import ${file}:`, err.message);
      failed++;
    }
  }

  console.log("\n── Import Stories Summary ──");
  console.log(`Files Processed: ${files.length}`);
  console.log(`Created:         ${created}`);
  console.log(`Updated:         ${updated}`);
  console.log(`Skipped:         ${skipped}`);
  console.log(`Failed:          ${failed}`);
  console.log("───────────────────────────\n");

  return { created, updated, skipped, failed };
}

// Run directly if invoked from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importStories()
    .then(async () => {
      await mongoose.connection.close(false);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error during import:", err);
      process.exit(1);
    });
}
