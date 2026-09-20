import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../db.js';

async function verify() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log("=== 1. POLITY AUDIT ===");
  const polities = await db.collection('polities').find({}).toArray();
  console.log(`Total polities: ${polities.length}`);
  for (const p of polities) {
    const capital = await db.collection('places').findOne({ _id: p.capital });
    console.log(`- ${p.name} (${p.type}, ${p.period.start}-${p.period.end}) | Capital: ${capital?.name} (${capital?._id}) | Color: ${p.colorHex}`);
  }

  console.log("\n=== 2. DEDUPLICATION & COLLISION CHECKS ===");
  const lahorePlaces = await db.collection('places').find({ name: { $regex: '^lahore$', $options: 'i' } }).toArray();
  console.log(`Lahore place count: ${lahorePlaces.length} (Expected: 1)`);
  lahorePlaces.forEach(p => console.log(`  _id: ${p._id}, polities: ${p.polities}`));

  const jodhpurPlaces = await db.collection('places').find({ name: { $regex: '^jodhpur$', $options: 'i' } }).toArray();
  console.log(`Jodhpur place count: ${jodhpurPlaces.length} (Expected: 1)`);

  const udaipurPlaces = await db.collection('places').find({ name: { $regex: '^udaipur$', $options: 'i' } }).toArray();
  console.log(`Udaipur place count: ${udaipurPlaces.length} (Expected: 1)`);

  const ranjitRulers = await db.collection('rulers').find({ name: { $regex: 'ranjit', $options: 'i' } }).toArray();
  console.log(`Ranjit rulers count: ${ranjitRulers.length} (Expected: 2 - one Bharatpur, one Sikh Empire)`);
  for (const r of ranjitRulers) {
    const pol = polities.find(p => String(p._id) === String(r.polity));
    console.log(`  - "${r.name}" | Title: ${r.title} | Reign: ${r.reignStart}-${r.reignEnd} | Polity: ${pol?.name} (${r.polity})`);
  }

  const bhimRulers = await db.collection('rulers').find({ name: { $regex: 'bhim', $options: 'i' } }).toArray();
  console.log(`Bhim rulers count: ${bhimRulers.length} (Expected: 1)`);
  for (const r of bhimRulers) {
    const pol = polities.find(p => String(p._id) === String(r.polity));
    console.log(`  - "${r.name}" | Title: ${r.title} | Reign: ${r.reignStart}-${r.reignEnd} | Polity: ${pol?.name} (${r.polity})`);
  }

  console.log("\n=== 3. NEW RULERS AUDIT ===");
  const newRulerNames = ["Ranjit Singh", "Vijay Singh of Marwar", "Man Singh of Marwar", "Ari Singh II", "Bhim Singh of Mewar"];
  for (const name of newRulerNames) {
    const r = await db.collection('rulers').findOne({ name });
    const pol = polities.find(p => String(p._id) === String(r?.polity));
    const pl = await db.collection('places').find({ _id: { $in: r?.places || [] } }).toArray();
    console.log(`- ${r?.name} (${r?.title}) | Reign: ${r?.reignStart}-${r?.reignEnd} | Polity: ${pol?.name} | Places: [${pl.map(x => x.name).join(', ')}]`);
  }

  console.log("\n=== 4. NEW TERRITORIES AUDIT ===");
  const targetPolityIds = polities.filter(p => ["Sikh Empire", "Kingdom of Marwar", "Kingdom of Mewar"].includes(p.name)).map(p => p._id);
  const targetTerritories = await db.collection('territories').find({ polity: { $in: targetPolityIds } }).toArray();
  console.log(`New polities territory count: ${targetTerritories.length} (Expected: 5)`);
  for (const t of targetTerritories) {
    const pol = polities.find(p => String(p._id) === String(t.polity));
    console.log(`- ${pol?.name} | Valid: ${t.validFrom}-${t.validTo} | Rep: ${t.representation} | Conf: ${t.confidence} | Geom: ${t.geometry.type} (${t.geometry.coordinates[0].length} points)`);
  }

  await mongoose.disconnect();
}

verify().catch(console.error);
