// backend/src/importers/importRulers.js
// Run with: node src/importers/importRulers.js
//
// Pulls a curated list of historical figures from Wikidata + DBpedia and
// upserts them as Ruler documents, each linked to an existing Polity by name
// and carrying a proper Source citation. Curation (which QIDs matter) is
// manual; fetching/formatting the data is automated.

import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../db.js";
import { getEntity, getDBpediaAbstract, wikidataUrl } from "./wikidata.js";
import Ruler from "../models/Ruler.js";
import Polity from "../models/Polity.js";
import Source from "../models/Source.js";

dotenv.config();

// Curated: Wikidata QID -> which existing Polity (by name) this ruler belongs to,
// plus any fields Wikidata/DBpedia won't reliably give us (title, reign years).
// Reign years come from discoverRulers.js output, cross-checked against the
// printed date ranges rather than trusted blindly.
const CURATED_RULERS = [
  {
    qid: "Q1569078", // Hyder Ali (verified)
    polityName: "Kingdom of Mysore",
    title: "Sultan (de facto ruler)",
    reignStart: 1761,
    reignEnd: 1782,
  },
  {
    qid: "Q10088", // Tipu Sultan (verified)
    polityName: "Kingdom of Mysore",
    title: "Sultan of Mysore",
    reignStart: 1782,
    reignEnd: 1799,
  },
  {
    qid: "Q192868", // Nadir Shah (verified)
    polityName: null, // not one of our seeded polities — imported as a standalone figure
    title: "Shah of Persia",
    reignStart: 1736,
    reignEnd: 1747,
  },
  {
    qid: "Q46798", // Ahmad Shah Durrani (verified)
    polityName: null,
    title: "Emir of the Durrani Empire",
    reignStart: 1747,
    reignEnd: 1772,
  },

  // --- Mughal emperors, 1700-1760 ---
  // Discovered via: node src/importers/discoverRulers.js Q15390704 "Mughal emperor"
  {
    qid: "Q6932430", // Azam Shah
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1707,
    reignEnd: 1707,
  },
  {
    qid: "Q544228", // Bahadur Shah I
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1707,
    reignEnd: 1712,
  },
  {
    qid: "Q544182", // Jahandar Shah
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1712,
    reignEnd: 1713,
  },
  {
    qid: "Q559490", // Farrukhsiyar
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1713,
    reignEnd: 1719,
  },
  {
    qid: "Q3236324", // Rafi ud-Darajat
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1719,
    reignEnd: 1719,
  },
  {
    qid: "Q3238719", // Shah Jahan II
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1719,
    reignEnd: 1719,
  },
  {
    qid: "Q558714", // Muhammad Shah — already seeded manually; this updates, not duplicates
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1719,
    reignEnd: 1748,
  },
  {
    qid: "Q400807", // Ahmad Shah Bahadur
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1748,
    reignEnd: 1754,
  },
  {
    qid: "Q732026", // Alamgir II
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1754,
    reignEnd: 1759,
  },
  {
    qid: "Q2627138", // Shah Jahan III
    polityName: "Mughal Empire",
    title: "Padshah",
    reignStart: 1759,
    reignEnd: 1760,
  },

  // --- Peshwas of the Maratha Confederacy ---
  // Discovered via: node src/importers/discoverRulers.js Q1816155 "Peshwa"
  {
    qid: "Q4849857", // Balaji Vishwanath
    polityName: "Maratha Confederacy",
    title: "Peshwa",
    reignStart: 1713,
    reignEnd: 1720,
  },
  // Baji Rao I (Q2514706) already seeded manually in seed.js — this updates it
  {
    qid: "Q2514706",
    polityName: "Maratha Confederacy",
    title: "Peshwa",
    reignStart: 1720,
    reignEnd: 1740,
  },
  {
    qid: "Q3629888", // Balaji Baji Rao
    polityName: "Maratha Confederacy",
    title: "Peshwa",
    reignStart: 1740,
    reignEnd: 1761,
  },
  {
    qid: "Q5971343", // Madhavrao I
    polityName: "Maratha Confederacy",
    title: "Peshwa",
    reignStart: 1761,
    reignEnd: 1772,
  },
  {
    qid: "Q6002978", // Narayanrao Peshwa
    polityName: "Maratha Confederacy",
    title: "Peshwa",
    reignStart: 1772,
    reignEnd: 1773,
  },
  {
    qid: "Q7283047", // Raghunathrao
    polityName: "Maratha Confederacy",
    title: "Peshwa",
    reignStart: 1773,
    reignEnd: 1774,
  },
  {
    qid: "Q6727333", // Madhavrao II
    polityName: "Maratha Confederacy",
    title: "Peshwa",
    reignStart: 1774,
    reignEnd: 1795,
  },
  {
    qid: "Q4848887", // Baji Rao II
    polityName: "Maratha Confederacy",
    title: "Peshwa",
    reignStart: 1796,
    reignEnd: 1818,
  },

  // --- Nizams of Hyderabad ---
  // Discovered via: node src/importers/discoverRulers.js Q613006 "Nizam of Hyderabad"
  // Muzaffar Jung had no P580/P582 dates in Wikidata — reign dates below are
  // verified against Wikipedia directly (see conversation), not auto-derived.
  {
    qid: "Q2621758", // Muzaffar Jung
    polityName: "Nizam of Hyderabad",
    title: "Nizam",
    reignStart: 1750,
    reignEnd: 1751,
  },

  // --- Wodeyars of Mysore ---
  // Discovered via: node src/importers/discoverRulers.js Q16931937 "Maharaja of Mysore"
  // Note: Wikidata's SPARQL dates for Chamaraja Wodeyar VII were wrong
  // (said 1734-1766, matching his brother's reign) — corrected to 1732-1734
  // per Wikipedia, verified via web search.
  {
    qid: "Q5097433", // Chikka Devaraja Wodeyar
    polityName: "Kingdom of Mysore",
    title: "Maharaja",
    reignStart: 1673,
    reignEnd: 1704,
  },
  {
    qid: "Q6365457", // Kanthirava Narasaraja Wodeyar II
    polityName: "Kingdom of Mysore",
    title: "Maharaja",
    reignStart: 1704,
    reignEnd: 1714,
  },
  {
    qid: "Q5287740", // Dodda Krishnaraja I
    polityName: "Kingdom of Mysore",
    title: "Maharaja",
    reignStart: 1714,
    reignEnd: 1732,
  },
  {
    qid: "Q15904973", // Chamaraja Wodeyar VII — dates corrected, see note above
    polityName: "Kingdom of Mysore",
    title: "Maharaja",
    reignStart: 1732,
    reignEnd: 1734,
  },
  {
    qid: "Q6437602", // Krishnaraja Wadiyar II
    polityName: "Kingdom of Mysore",
    title: "Maharaja",
    reignStart: 1734,
    reignEnd: 1766,
  },
  {
    qid: "Q15905163", // Nanjaraja Wodeyar II
    polityName: "Kingdom of Mysore",
    title: "Maharaja",
    reignStart: 1766,
    reignEnd: 1770,
  },

  // --- Nawabs of Bengal ---
  // Discovered via: node src/importers/discoverRulers.js Q2637089 "Nawab of Bengal"
  // Requires polity "Nawab of Bengal" to exist first — run addPolities.js before this.
  {
    qid: "Q3634642", // Murshid Quli Khan
    polityName: "Nawab of Bengal",
    title: "Nawab",
    reignStart: 1717,
    reignEnd: 1727,
  },
  {
    qid: "Q7504779", // Shuja-ud-Din Muhammad Khan
    polityName: "Nawab of Bengal",
    title: "Nawab",
    reignStart: 1727,
    reignEnd: 1739,
  },
  {
    qid: "Q7423869", // Sarfaraz Khan
    polityName: "Nawab of Bengal",
    title: "Nawab",
    reignStart: 1739,
    reignEnd: 1740,
  },
  {
    qid: "Q2606620", // Alivardi Khan
    polityName: "Nawab of Bengal",
    title: "Nawab",
    reignStart: 1740,
    reignEnd: 1756,
  },
  {
    qid: "Q1998495", // Siraj ud-Daulah
    polityName: "Nawab of Bengal",
    title: "Nawab",
    reignStart: 1756,
    reignEnd: 1757,
  },
  {
    qid: "Q3241725", // Mir Jafar (first reign)
    polityName: "Nawab of Bengal",
    title: "Nawab",
    reignStart: 1757,
    reignEnd: 1760,
  },
  {
    qid: "Q3595321", // Mir Qasim
    polityName: "Nawab of Bengal",
    title: "Nawab",
    reignStart: 1760,
    reignEnd: 1763,
  },
  {
    qid: "Q16859433", // Najmuddin Ali Khan
    polityName: "Nawab of Bengal",
    title: "Nawab",
    reignStart: 1765,
    reignEnd: 1766,
  },

  // --- Nawabs of Awadh ---
  // Discovered via: node src/importers/discoverRulers.js Q2614237 "Nawab of Awadh"
  {
    qid: "Q641646", // Saadat Ali Khan I
    polityName: "Nawab of Awadh",
    title: "Nawab",
    reignStart: 1722,
    reignEnd: 1739,
  },
  {
    qid: "Q391381", // Safdar Jang
    polityName: "Nawab of Awadh",
    title: "Nawab",
    reignStart: 1739,
    reignEnd: 1754,
  },
  {
    qid: "Q642993", // Shuja-ud-Daula
    polityName: "Nawab of Awadh",
    title: "Nawab",
    reignStart: 1754,
    reignEnd: 1775,
  },

  // --- Non-ruler figures (broadened "People" scope per project decision) ---
  // These aren't monarchs — reignStart/reignEnd represent their period of
  // active command/prominence in India, not a literal reign. polityName is
  // intentionally null throughout; verified via findEntity.js + web search
  // for dates (see conversation), not guessed.
  {
    qid: "Q162296", // Robert Clive
    polityName: null,
    title: "Commander & Governor, British East India Company",
    reignStart: 1744,
    reignEnd: 1767,
  },
  {
    qid: "Q5696873", // Hector Munro, 8th of Novar
    polityName: null,
    title: "Commander, British East India Company",
    reignStart: 1760,
    reignEnd: 1782,
  },
];

async function importRulers() {
  await connectDB();

  for (const entry of CURATED_RULERS) {
    console.log(`Fetching ${entry.qid}...`);
    const entity = await getEntity(entry.qid);
    if (!entity || !entity.label) {
      console.warn(`  Skipped ${entry.qid} — no data returned from Wikidata.`);
      continue;
    }

    const bio = await getDBpediaAbstract(entity.wikipediaTitle);

    let polity = null;
    if (entry.polityName) {
      polity = await Polity.findOne({ name: entry.polityName });
      if (!polity) {
        console.warn(`  Polity "${entry.polityName}" not found — importing ruler without a polity link.`);
      }
    }

    let source = await Source.findOne({ url: wikidataUrl(entry.qid) });
    if (!source) {
      source = await Source.create({
        title: `${entity.label} — Wikidata`,
        type: "wikidata",
        url: wikidataUrl(entry.qid),
        notes: "Imported automatically via SPARQL; bio text sourced from DBpedia (CC BY-SA, derived from Wikipedia).",
      });
    }

    const rulerDoc = {
      name: entity.label,
      title: entry.title,
      reignStart: entry.reignStart,
      reignEnd: entry.reignEnd,
      birthYear: entity.birthYear,
      deathYear: entity.deathYear,
      polity: polity?._id,
      imageUrl: entity.image,
      bio: bio ? bio.slice(0, 600) : entity.description,
      sources: [source._id],
    };

    try {
      const existing = await Ruler.findOne({ name: entity.label });
      if (existing) {
        await Ruler.updateOne({ _id: existing._id }, rulerDoc);
        console.log(`  Updated: ${entity.label}`);
      } else {
        await Ruler.create(rulerDoc);
        console.log(`  Created: ${entity.label}`);
      }
    } catch (err) {
      console.error(`  FAILED to save ${entity.label}: ${err.message}`);
      // continue to the next entry rather than aborting the whole batch
    }
  }

  console.log("\nImport complete.");
  await mongoose.disconnect();
}

importRulers().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
