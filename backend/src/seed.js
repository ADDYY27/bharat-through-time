import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import Source from "./models/Source.js";
import Place from "./models/Place.js";
import Ruler from "./models/Ruler.js";
import Polity from "./models/Polity.js";
import Territory from "./models/Territory.js";
import Event from "./models/Event.js";

dotenv.config();

async function seed() {
  await connectDB();

  await Promise.all([
    Source.deleteMany({}),
    Place.deleteMany({}),
    Ruler.deleteMany({}),
    Polity.deleteMany({}),
    Territory.deleteMany({}),
    Event.deleteMany({}),
  ]);

  // ---------- Sources ----------
  const [
    wikiMaratha, wikiMughal, wikiNizam, wikiMysore, wikiSikh,
  ] = await Source.create([
    { title: "Maratha Empire — Wikipedia", type: "wikipedia", url: "https://en.wikipedia.org/wiki/Maratha_Empire" },
    { title: "Mughal Empire — Wikipedia", type: "wikipedia", url: "https://en.wikipedia.org/wiki/Mughal_Empire" },
    { title: "Hyderabad State / Asaf Jahi dynasty — Wikipedia", type: "wikipedia", url: "https://en.wikipedia.org/wiki/Asaf_Jahi_dynasty" },
    { title: "Kingdom of Mysore — Wikipedia", type: "wikipedia", url: "https://en.wikipedia.org/wiki/Kingdom_of_Mysore" },
    { title: "Sikh Confederacy (Dal Khalsa) — Wikipedia", type: "wikipedia", url: "https://en.wikipedia.org/wiki/Dal_Khalsa_(Sikh_army)" },
  ]);

  // ---------- Places (capitals) ----------
  const [pune, delhi, hyderabad, mysoreCity, lahore] = await Place.create([
    { name: "Pune", type: "capital", location: { type: "Point", coordinates: [73.8567, 18.5204] }, modernState: "Maharashtra", description: "Seat of the Peshwas.", sources: [wikiMaratha._id] },
    { name: "Delhi", type: "capital", location: { type: "Point", coordinates: [77.2090, 28.6139] }, modernState: "Delhi", description: "Imperial Mughal capital (Shahjahanabad).", sources: [wikiMughal._id] },
    { name: "Hyderabad", type: "capital", location: { type: "Point", coordinates: [78.4867, 17.3850] }, modernState: "Telangana", description: "Seat of the Nizams of Hyderabad.", sources: [wikiNizam._id] },
    { name: "Mysore", type: "capital", location: { type: "Point", coordinates: [76.6394, 12.2958] }, modernState: "Karnataka", description: "Capital of the Wodeyar/Mysore Kingdom.", sources: [wikiMysore._id] },
    { name: "Lahore", type: "capital", location: { type: "Point", coordinates: [74.3587, 31.5497] }, modernState: "Punjab (Pakistan)", description: "Historic Punjab capital, later Sikh seat of power under the Confederacy/Empire.", sources: [wikiSikh._id] },
  ]);

  // ---------- Polities ----------
  const [marathas, mughals, nizam, mysore, sikhs] = await Polity.create([
    { name: "Maratha Confederacy", type: "confederacy", period: { start: 1674, end: 1818 }, capital: pune._id, description: "A major power founded by Shivaji, later administered under the Peshwas as a confederacy of allied chiefs.", colorHex: "#cc6633", sources: [wikiMaratha._id] },
    { name: "Mughal Empire", type: "empire", period: { start: 1526, end: 1857 }, capital: delhi._id, description: "Once the dominant power of the subcontinent; by the 18th century in political decline, though still nominally paramount.", colorHex: "#2e7d32", sources: [wikiMughal._id] },
    { name: "Nizam of Hyderabad", type: "kingdom", period: { start: 1724, end: 1948 }, capital: hyderabad._id, description: "Founded by Asaf Jah I, a former Mughal governor of the Deccan who established de facto independence.", colorHex: "#6a1b9a", sources: [wikiNizam._id] },
    { name: "Kingdom of Mysore", type: "kingdom", period: { start: 1399, end: 1950 }, capital: mysoreCity._id, description: "A South Indian kingdom ruled by the Wodeyar dynasty, later dominated by Hyder Ali and Tipu Sultan later in the century.", colorHex: "#c62828", sources: [wikiMysore._id] },
    { name: "Sikh Confederacy", type: "confederacy", period: { start: 1707, end: 1799 }, capital: lahore._id, description: "A loose confederation of Sikh misls (armed bands) that controlled Punjab in the wake of Mughal decline, later unified under Ranjit Singh.", colorHex: "#f9a825", sources: [wikiSikh._id] },
  ]);

  // ---------- Rulers ----------
  await Ruler.create([
    { name: "Baji Rao I", title: "Peshwa", dynasty: "Bhat (Peshwa lineage)", reignStart: 1720, reignEnd: 1740, birthYear: 1700, deathYear: 1740, polity: marathas._id, bio: "Peshwa who dramatically expanded Maratha territory northward into Malwa and Gujarat.", sources: [wikiMaratha._id] },
    { name: "Muhammad Shah", title: "Padshah", dynasty: "Timurid (Mughal)", reignStart: 1719, reignEnd: 1748, birthYear: 1702, deathYear: 1748, polity: mughals._id, bio: "Mughal emperor during a period of severe territorial and political decline, including Nadir Shah's sack of Delhi in 1739.", sources: [wikiMughal._id] },
    { name: "Asaf Jah I", title: "Nizam", dynasty: "Asaf Jahi", reignStart: 1724, reignEnd: 1748, birthYear: 1671, deathYear: 1748, polity: nizam._id, bio: "Former Mughal governor of the Deccan who established the effectively independent state of Hyderabad.", sources: [wikiNizam._id] },
    { name: "Krishnaraja Wodeyar II", title: "Maharaja", dynasty: "Wodeyar", reignStart: 1734, reignEnd: 1766, birthYear: 1728, deathYear: 1766, polity: mysore._id, bio: "Nominal Wodeyar ruler of Mysore during the period when actual power increasingly passed to the military commander Hyder Ali.", sources: [wikiMysore._id] },
  ]);

  // ---------- Territories (rough placeholder polygons; confidence: low) ----------
  await Territory.create([
    { polity: marathas._id, validFrom: 1730, validTo: 1748, geometry: { type: "Polygon", coordinates: [[[73.0, 21.5], [76.5, 21.5], [78.5, 19.0], [77.0, 16.0], [74.0, 15.5], [72.8, 18.0], [73.0, 21.5]]] }, confidence: "low", sources: [wikiMaratha._id] },
    { polity: mughals._id, validFrom: 1700, validTo: 1760, geometry: { type: "Polygon", coordinates: [[[74.0, 32.0], [80.0, 32.0], [84.0, 27.0], [82.0, 24.0], [77.0, 22.5], [74.0, 25.0], [74.0, 32.0]]] }, confidence: "low", sources: [wikiMughal._id] },
    { polity: nizam._id, validFrom: 1724, validTo: 1760, geometry: { type: "Polygon", coordinates: [[[77.0, 19.5], [80.5, 19.5], [81.5, 17.0], [79.5, 15.5], [77.5, 16.5], [77.0, 19.5]]] }, confidence: "low", sources: [wikiNizam._id] },
    { polity: mysore._id, validFrom: 1700, validTo: 1760, geometry: { type: "Polygon", coordinates: [[[75.5, 13.5], [77.5, 13.5], [78.0, 11.5], [76.5, 10.5], [75.3, 11.8], [75.5, 13.5]]] }, confidence: "low", sources: [wikiMysore._id] },
    { polity: sikhs._id, validFrom: 1716, validTo: 1760, geometry: { type: "Polygon", coordinates: [[[73.0, 32.5], [76.5, 32.5], [77.0, 30.0], [74.5, 29.0], [72.5, 30.5], [73.0, 32.5]]] }, confidence: "low", sources: [wikiSikh._id] },
  ]);

  // ---------- Events ----------
  await Event.create([
    { title: "Battle of Palkhed", type: "battle", year: 1728, description: "Baji Rao I defeated the Nizam of Hyderabad through a campaign of maneuver, a decisive early Maratha victory.", polities: [marathas._id, nizam._id], place: pune._id, outcome: "Maratha victory; Treaty of Mungi Shevgaon followed.", sources: [wikiMaratha._id] },
    { title: "Sack of Delhi by Nadir Shah", type: "conquest", year: 1739, description: "The Persian ruler Nadir Shah invaded and sacked Delhi, severely weakening Mughal prestige and treasury.", polities: [mughals._id], place: delhi._id, outcome: "Massive plunder taken from Delhi; Mughal authority further undermined.", sources: [wikiMughal._id] },
    { title: "Founding of Hyderabad State", type: "founding", year: 1724, description: "Asaf Jah I, Mughal governor of the Deccan, effectively broke from central Mughal authority to found an independent state.", polities: [nizam._id, mughals._id], place: hyderabad._id, outcome: "De facto independent Hyderabad State established.", sources: [wikiNizam._id] },
  ]);

  console.log("Seed complete — 5 polities, 5 rulers, 5 territories, 3 events.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});