// backend/src/importers/events.js
// Run with: node src/importers/events.js
//
// All non-destructive event additions in ONE file (merged from what used
// to be addEvents.js + addEvents2.js). Extend EVENTS going forward — do
// not create addEvents3.js.
//
// Each entry, by default, fetches its own Wikidata coordinates and creates
// a battle_site Place from them. Set `placeName` instead to reuse an
// existing Place (e.g. Buxar, already imported as a real city) rather than
// creating a new one. Set `sourceOverride` to cite something other than
// the event's own Wikidata page (e.g. a Wikipedia article, when no clean
// battle-specific Wikidata entity exists).

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../db.js";
import { getEntity, wikidataUrl } from "./wikidata.js";
import Polity from "../models/Polity.js";
import Ruler from "../models/Ruler.js";
import Place from "../models/Place.js";
import Source from "../models/Source.js";
import Event from "../models/Event.js";

dotenv.config();

const EVENTS = [
  {
    qid: "Q203233", title: "Battle of Plassey", type: "battle", year: 1757,
    description: "The British East India Company, led by Robert Clive, defeated Nawab Siraj ud-Daulah of Bengal, decided in large part by the defection of the Nawab's commander Mir Jafar, who had secretly agreed to support the Company in exchange for the throne.",
    outcome: "Company victory. Siraj ud-Daulah was deposed and killed; Mir Jafar installed as a Company-controlled puppet Nawab, marking the start of British political dominance in Bengal.",
    polities: ["Nawab of Bengal"], rulers: ["Siraj ud-Daulah", "Mir Jafar", "Robert Clive"],
  },
  {
    placeName: "Buxar",
    sourceOverride: { title: "Battle of Buxar — Wikipedia", type: "wikipedia", url: "https://en.wikipedia.org/wiki/Battle_of_Buxar", notes: "Verified via web search cross-referencing multiple sources on date, combatants, and outcome." },
    title: "Battle of Buxar", type: "battle", year: 1764,
    description: "A combined army of the deposed Bengal Nawab Mir Qasim, the Nawab of Awadh Shuja-ud-Daula, and the Mughal emperor Shah Alam II was decisively defeated by British East India Company forces under Hector Munro.",
    outcome: "Company victory. Led to the Treaty of Allahabad (1765), under which the Mughal emperor granted the Company Diwani rights (revenue collection) over Bengal, Bihar, and Odisha.",
    polities: ["Nawab of Bengal", "Nawab of Awadh", "Mughal Empire"], rulers: ["Mir Qasim", "Shuja-ud-Daula", "Hector Munro, 8th of Novar"],
  },
  {
    qid: "Q2663849", title: "Battle of Colachel", type: "battle", year: 1741,
    description: "Travancore, under Marthanda Varma, decisively defeated the Dutch East India Company — a rare and famous instance of an Asian power defeating a European colonial military force.",
    outcome: "Travancore victory. Halted further Dutch military ambitions in the region and boosted Travancore's regional standing.",
    polities: ["Kingdom of Travancore"], rulers: ["Marthanda Varma"],
  },
  {
    qid: "Q1362162", title: "First Carnatic War", type: "other", year: 1746,
    description: "Extension of the War of the Austrian Succession into the Carnatic region of India, fought primarily between French and British forces with local Nawab of Carnatic forces drawn in.",
    outcome: "Ended by the Treaty of Aix-la-Chapelle (1748); Madras, captured by the French, was returned to the British.",
    polities: ["Nawab of Carnatic"], rulers: [],
    placeName: "Arcot",
  },
  {
    qid: "Q4870217", title: "Battle of Adyar", type: "battle", year: 1746,
    description: "Part of the First Carnatic War: a small French force decisively defeated a much larger army sent by the Nawab of Carnatic, demonstrating European drilled infantry's advantage over traditional Indian armies for the first time.",
    outcome: "French victory; a turning point demonstrating European military tactics' effectiveness in India.",
    polities: ["Nawab of Carnatic"], rulers: [],
    placeName: "Adyar",
  },
  {
    qid: "Q233601", title: "Second Carnatic War", type: "other", year: 1749,
    description: "A succession struggle for the Nawab of Carnatic's throne between rival claimants (Muhammed Ali Khan Wallajah, British-backed, and Chanda Sahib, French-backed), fought alongside the broader Anglo-French rivalry in India.",
    outcome: "Muhammed Ali Khan Wallajah secured the Nawabship with British support, cementing British influence in the Carnatic.",
    polities: ["Nawab of Carnatic"], rulers: ["Muhammed Ali Khan Wallajah"],
    placeName: "Arcot",
  },
  {
    qid: "Q4870289", title: "Battle of Ambur", type: "battle", year: 1749,
    description: "The reigning Nawab of Carnatic, Anwaruddin Khan, was killed in battle against the French-backed claimant Chanda Sahib, opening the way for the succession dispute that became the Second Carnatic War.",
    outcome: "Chanda Sahib's faction victorious; Anwaruddin Khan killed. His son Muhammed Ali Khan Wallajah fled and later reclaimed the Nawabship with British backing.",
    polities: ["Nawab of Carnatic"], rulers: ["Muhammed Ali Khan Wallajah"],
  },
  {
    qid: "Q2887875", title: "Siege of Arcot", type: "battle", year: 1751,
    description: "Robert Clive led a small British East India Company force to seize and successfully defend Arcot, the Carnatic capital, against a much larger besieging force — a celebrated early demonstration of Clive's military leadership.",
    outcome: "British/Wallajah victory; significantly boosted British East India Company prestige and Wallajah's claim to the Nawabship.",
    polities: ["Nawab of Carnatic"], rulers: ["Muhammed Ali Khan Wallajah", "Robert Clive"],
  },
  {
    qid: "Q658845", title: "Battle of Wandiwash", type: "battle", year: 1760,
    description: "Fought as part of the Seven Years' War, British forces under Eyre Coote decisively defeated the French under the Comte de Lally in the Carnatic region.",
    outcome: "Decisive British victory; effectively ended serious French ambitions to be a major colonial power in India.",
    polities: ["Nawab of Carnatic"], rulers: [],
  },
  {
    qid: "Q1259218", title: "Third Battle of Panipat", type: "battle", year: 1761,
    description: "The Maratha Confederacy, at the height of its northward expansion, suffered a catastrophic defeat against the Afghan Durrani Empire under Ahmad Shah Durrani, allied with Rohilla and Awadh forces.",
    outcome: "Decisive Durrani/allied victory with immense Maratha casualties; severely set back Maratha power in North India for a decade.",
    polities: ["Maratha Confederacy"], rulers: ["Balaji Baji Rao", "Ahmed Shahe Durrani"],
  },
  {
    qid: "Q4872156", title: "Battle of Rakshasbhuvan", type: "battle", year: 1763,
    description: "The Maratha Confederacy under Peshwa Madhavrao I decisively defeated the Nizam of Hyderabad, reasserting Maratha dominance in the Deccan after the setback at Panipat two years earlier.",
    outcome: "Decisive Maratha victory; forced the Nizam to cede territory and restored Maratha prestige in the Deccan.",
    polities: ["Maratha Confederacy", "Nizam of Hyderabad"], rulers: ["Madhavrao I"],
    placeName: "Rakshasbhuvan",
  },
  {
    qid: "Q2985337", title: "Treaty of Salbai", type: "treaty", year: 1782,
    description: "Ended the First Anglo-Maratha War between the Maratha Confederacy and the British East India Company, largely negotiated on the Maratha side by statesman Nana Phadnavis during the regency-era reign of Madhavrao II.",
    outcome: "Restored pre-war territorial status largely in the Marathas' favor and secured roughly two decades of peace between the Marathas and the British.",
    polities: ["Maratha Confederacy"], rulers: ["Madhavrao II"],
  },

  // --- Phase 3 Verified Events ---
  {
    qid: "Q4870477", title: "Battle of Bhopal", type: "battle", year: 1737,
    description: "Maratha forces led by Peshwa Baji Rao I besieged and defeated a combined army of the Mughal Empire and the Nizam of Hyderabad at Bhopal, consolidating Maratha supremacy in Central India.",
    outcome: "Decisive Maratha victory. Led to the Convention of Doraha, granting the Marathas complete sovereignty over the province of Malwa.",
    polities: ["Maratha Confederacy", "Mughal Empire", "Nizam of Hyderabad"], rulers: ["Baji Rao I", "Asaf Jah I"],
    placeName: "Bhopal",
  },
  {
    qid: "Q2736986", title: "Battle of Karnal", type: "battle", year: 1739,
    description: "Nader Shah of Persia decisively crushed the numerically superior Mughal imperial army of Muhammad Shah at Karnal in Haryana, leaving Delhi completely undefended.",
    outcome: "Decisive Persian victory. Led to the occupation and devastating sack of Delhi by Nader Shah, accelerating the irreversible decline of the Mughal Empire.",
    polities: ["Mughal Empire"], rulers: ["Muhammad Shah", "Nader Shah"],
    placeName: "Karnal",
  },
  {
    qid: "Q55605044", title: "Battle of Udgir", type: "battle", year: 1760,
    description: "Maratha army commanded by Sadashivrao Bhau decisively defeated the forces of the Nizam of Hyderabad at the fort of Udgir in the Deccan.",
    outcome: "Decisive Maratha victory. The Nizam was forced to surrender strategic fortresses including Daulatabad, Asirgarh, and Bijapur, along with territory yielding substantial revenue.",
    polities: ["Maratha Confederacy", "Nizam of Hyderabad"], rulers: ["Balaji Baji Rao"],
    placeName: "Udgir",
  },
  {
    qid: "Q4062556", title: "Treaty of Allahabad", type: "treaty", year: 1765,
    description: "Negotiated by Robert Clive following the Battle of Buxar with Mughal Emperor Shah Alam II and the Nawab of Awadh Shuja-ud-Daula at the Allahabad Fort.",
    outcome: "The Mughal Emperor granted the British East India Company the Diwani (revenue collection rights) over Bengal, Bihar, and Orissa, marking the legal beginning of Company rule in India.",
    polities: ["Mughal Empire", "Nawab of Awadh", "Nawab of Bengal"], rulers: ["Shuja-ud-Daula", "Robert Clive"],
    placeName: "Allahabad Fort",
  },
  {
    qid: "Q29025937", title: "Battle of Wadgaon", type: "battle", year: 1779,
    description: "Maratha forces under Mahadji Shinde and Tukoji Holkar surrounded and defeated an invading British East India Company force advancing from Bombay through the Western Ghats.",
    outcome: "Decisive Maratha victory. Forced the British commanders to sign the Wadgaon Convention, surrendering all territories acquired since 1773.",
    polities: ["Maratha Confederacy"], rulers: ["Madhavrao II"],
    placeName: "Vadgaon (Maval)",
  },
  {
    qid: "Q568613", title: "Battle of Pollilur", type: "battle", year: 1780,
    description: "Fought during the Second Anglo-Mysore War at the village of Pullalur near Kanchipuram; Hyder Ali and Tipu Sultan encircled and decimated a British East India Company column commanded by Colonel William Baillie.",
    outcome: "Decisive Mysore victory. Baillie's force was annihilated and captured, marking one of the worst defeats suffered by the British in India.",
    polities: ["Kingdom of Mysore"], rulers: ["Hyder Ali", "Tipu Sultan"],
    placeName: "Pullalur",
  },
  {
    qid: "Q4872089", title: "Battle of Porto Novo", type: "battle", year: 1781,
    description: "British forces under Sir Eyre Coote engaged and defeated the Mysore army of Hyder Ali at Porto Novo (Parangipettai) on the Coromandel coast.",
    outcome: "British victory. Checked Hyder Ali's offensive in the Carnatic and relieved pressure on Madras.",
    polities: ["Kingdom of Mysore", "Nawab of Carnatic"], rulers: ["Hyder Ali"],
    placeName: "Parangipettai",
  },
  {
    qid: "Q7837140", title: "Treaty of Mangalore", type: "treaty", year: 1784,
    description: "Signed at Mangalore between Tipu Sultan of Mysore and the British East India Company, officially concluding the Second Anglo-Mysore War.",
    outcome: "Restored status quo ante bellum with mutual restitution of prisoners and conquests; the last time an Indian ruler successfully dictated treaty terms to the British.",
    polities: ["Kingdom of Mysore"], rulers: ["Tipu Sultan"],
    placeName: "Mangaluru",
  },
  {
    qid: "Q793828", title: "Battle of Kharda", type: "battle", year: 1795,
    description: "The combined Maratha Confederacy under Nana Phadnavis, including forces of the Peshwa, Scindia, Holkar, and Bhonsle, decisively defeated the Nizam of Hyderabad at Kharda.",
    outcome: "Decisive Maratha victory. Forced the Nizam to cede extensive territories including the fort of Daulatabad and pay a large war indemnity; the last battle where all major Maratha chiefs fought united.",
    polities: ["Maratha Confederacy", "Nizam of Hyderabad"], rulers: ["Madhavrao II"],
    placeName: "Kharda",
  },
  {
    qid: "Q815204", title: "Siege of Seringapatam", type: "battle", year: 1799,
    description: "Coalition forces of the British East India Company and the Nizam of Hyderabad besieged and stormed the island fortress of Seringapatam in the Fourth Anglo-Mysore War.",
    outcome: "Decisive British-allied victory. Tipu Sultan was killed defending the breaches, ending the independent Kingdom of Mysore and restoring the Wodeyar dynasty under a British subsidiary alliance.",
    polities: ["Kingdom of Mysore", "Nizam of Hyderabad"], rulers: ["Tipu Sultan"],
    placeName: "Srirangapatna",
  },
  {
    qid: "Q2095678", title: "Battle of Assaye", type: "battle", year: 1803,
    description: "A pivotal battle of the Second Anglo-Maratha War; Major General Arthur Wellesley led a British force to victory against a numerically superior combined army of Scindia and Berar at Assaye.",
    outcome: "Decisive British victory. Shattered the military power of the Scindia and Bhonsle dynasties in the Deccan.",
    polities: ["Maratha Confederacy"], rulers: ["Baji Rao II"],
    placeName: "Assaye",
  },
  {
    qid: "Q4871419", title: "Battle of Khadki", type: "battle", year: 1817,
    description: "The opening battle of the Third Anglo-Maratha War; British East India Company forces repulsed an attack by Peshwa Baji Rao II's army at Khadki near Pune.",
    outcome: "British victory. Led to the British occupation of the Maratha capital at Pune and the flight of Peshwa Baji Rao II.",
    polities: ["Maratha Confederacy"], rulers: ["Baji Rao II"],
    placeName: "Khadki",
  },
  {
    qid: "Q4871633", title: "Battle of Mahidpur", type: "battle", year: 1817,
    description: "Fought during the Third Anglo-Maratha War at the town of Mahidpur on the Shipra River; British forces under Sir Thomas Hislop defeated the Holkar army.",
    outcome: "Decisive British victory. Broke Holkar resistance in Central India and resulted in the Treaty of Mandsaur (1818), stripping the Holkars of their tributary domains.",
    polities: ["Maratha Confederacy"], rulers: ["Baji Rao II"],
    placeName: "Mahidpur",
  },
  {
    qid: "Q3630511", title: "Battle of Koregaon", type: "battle", year: 1818,
    description: "A small Company battalion (predominantly Mahar soldiers of the Bombay Native Infantry) successfully defended the village of Koregaon Bhima against a much larger Peshwa army.",
    outcome: "Company tactical success; the Peshwa's forces withdrew upon British reinforcements, paving the way for the eventual surrender of Peshwa Baji Rao II.",
    polities: ["Maratha Confederacy"], rulers: ["Baji Rao II"],
    placeName: "Koregaon Bhima",
  },
];

async function polityIds(names) {
  const ids = [];
  for (const name of names) {
    const p = await Polity.findOne({ name });
    if (p) ids.push(p._id);
    else console.warn(`    (polity "${name}" not found)`);
  }
  return ids;
}
async function rulerIds(names) {
  const ids = [];
  for (const name of names) {
    const r = await Ruler.findOne({ name });
    if (r) ids.push(r._id);
    else console.warn(`    (ruler "${name}" not found)`);
  }
  return ids;
}

async function run() {
  await connectDB();

  for (const ev of EVENTS) {
    console.log(`\nBuilding: ${ev.title}...`);

    let place = null;
    if (ev.placeName) {
      place = await Place.findOne({ name: ev.placeName });
      if (!place) console.warn(`  Place "${ev.placeName}" not found — event will have no place.`);
    } else if (ev.qid) {
      const entity = await getEntity(ev.qid);
      if (entity?.coordinates) {
        const placeName = `${ev.title} site`;
        place = await Place.findOne({ name: placeName });
        if (!place) {
          place = await Place.create({
            name: placeName, type: "battle_site",
            location: { type: "Point", coordinates: entity.coordinates },
            description: entity.description, sources: [],
          });
        }
      } else {
        console.warn(`  No coordinates found for ${ev.title} — event will have no place.`);
      }
    }

    let source;
    if (ev.sourceOverride) {
      source = await Source.findOne({ title: ev.sourceOverride.title });
      if (!source) source = await Source.create(ev.sourceOverride);
    } else {
      source = await Source.findOne({ url: wikidataUrl(ev.qid) });
      if (!source) {
        source = await Source.create({
          title: `${ev.title} — Wikidata`, type: "wikidata", url: wikidataUrl(ev.qid),
          notes: "Verified via findEntity.js before import.",
        });
      }
    }

    if (place) await Place.updateOne({ _id: place._id }, { $addToSet: { sources: source._id } });

    const eventDoc = {
      title: ev.title, type: ev.type, year: ev.year, description: ev.description,
      polities: await polityIds(ev.polities), rulers: await rulerIds(ev.rulers),
      place: place?._id, outcome: ev.outcome, sources: [source._id],
    };

    try {
      const existing = await Event.findOne({ title: ev.title });
      if (existing) { await Event.updateOne({ _id: existing._id }, eventDoc); console.log(`  Updated: ${ev.title}`); }
      else { await Event.create(eventDoc); console.log(`  Created: ${ev.title}`); }
    } catch (err) { console.error(`  FAILED ${ev.title}: ${err.message}`); }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

run().catch((err) => { console.error("Failed:", err); process.exit(1); });