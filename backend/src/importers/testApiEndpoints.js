import 'dotenv/config';

const BASE_URL = "http://localhost:5000";

async function testYear(year, expectedChecks) {
  console.log(`\n================ Testing Year ${year} ================`);
  const res = await fetch(`${BASE_URL}/api/history/${year}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${year}`);
  const data = await res.json();

  console.log(`Territories returned: ${data.territories?.length}`);
  console.log(`Rulers returned: ${data.rulers?.length}`);

  const activePolityNames = data.territories.map(t => t.polity?.name);
  console.log("Active polities on map:", activePolityNames.join(", "));

  for (const [polityName, expectedRep] of Object.entries(expectedChecks)) {
    const matchingT = data.territories.find(t => t.polity?.name === polityName);
    if (!expectedRep) {
      if (matchingT) {
        console.error(`❌ FAILED: ${polityName} should NOT be active in ${year}, but found with rep: ${matchingT.representation}`);
      } else {
        console.log(`✅ PASSED: ${polityName} is correctly INACTIVE in ${year}`);
      }
    } else {
      if (!matchingT) {
        console.error(`❌ FAILED: ${polityName} should be active in ${year} with rep: ${expectedRep}, but was NOT found`);
      } else if (matchingT.representation !== expectedRep) {
        console.error(`❌ FAILED: ${polityName} has rep: ${matchingT.representation}, expected: ${expectedRep}`);
      } else {
        console.log(`✅ PASSED: ${polityName} is active with representation: ${matchingT.representation}`);
      }
    }
  }

  // Check overview endpoint as well
  const ovRes = await fetch(`${BASE_URL}/api/history/${year}/overview`);
  if (!ovRes.ok) throw new Error(`Overview HTTP ${ovRes.status} for ${year}`);
  const ovData = await ovRes.json();
  console.log(`Overview counts: Polities=${ovData.counts.polities}, Rulers=${ovData.counts.rulers}, Events=${ovData.counts.events}, Places=${ovData.counts.places}`);
}

async function testEntityRoutes() {
  console.log("\n================ Testing Entity Detail Routes ================");

  // 1. Sikh Empire detail
  const politiesRes = await fetch(`${BASE_URL}/api/history/1805`);
  const politiesData = await politiesRes.json();
  const sikhT = politiesData.territories.find(t => t.polity?.name === "Sikh Empire");
  const marwarT = politiesData.territories.find(t => t.polity?.name === "Kingdom of Marwar");
  const mewarT = politiesData.territories.find(t => t.polity?.name === "Kingdom of Mewar");

  const sikhPolityId = sikhT?.polity?._id;
  const marwarPolityId = marwarT?.polity?._id;
  const mewarPolityId = mewarT?.polity?._id;

  // Polity detail test
  for (const [name, id] of [["Sikh Empire", sikhPolityId], ["Kingdom of Marwar", marwarPolityId], ["Kingdom of Mewar", mewarPolityId]]) {
    const r = await fetch(`${BASE_URL}/api/history/polity/${id}`);
    const d = await r.json();
    console.log(`✅ Polity /polity/${id} (${name}):`);
    console.log(`   Capital: ${d.polity?.capital?.name} | Rulers count: ${d.rulers?.length} (${d.rulers?.map(x=>x.name).join(', ')}) | Territories: ${d.territories?.length}`);
  }

  // Capital place detail tests
  const lahoreId = sikhT?.polity?.capital?._id;
  const jodhpurId = marwarT?.polity?.capital?._id;
  const udaipurId = mewarT?.polity?.capital?._id;

  for (const [name, id] of [["Lahore", lahoreId], ["Jodhpur", jodhpurId], ["Udaipur", udaipurId]]) {
    const r = await fetch(`${BASE_URL}/api/history/place/${id}`);
    const d = await r.json();
    console.log(`✅ Place /place/${id} (${name}):`);
    console.log(`   Coords: [${d.place?.location?.coordinates}] | Associated Rulers: ${d.rulers?.length} (${d.rulers?.map(x=>x.name).join(', ')})`);
  }

  // Ruler detail tests
  const ranjitRuler = politiesData.rulers.find(r => r.name === "Ranjit Singh");
  if (ranjitRuler) {
    const r = await fetch(`${BASE_URL}/api/history/ruler/${ranjitRuler._id}`);
    const d = await r.json();
    console.log(`✅ Ruler /ruler/${ranjitRuler._id} (${d.ruler?.name}):`);
    console.log(`   Title: ${d.ruler?.title} | Reign: ${d.ruler?.reignStart}-${d.ruler?.reignEnd} | Polity: ${d.ruler?.polity?.name} | Capital Place: ${d.ruler?.places?.map(p=>p.name).join(', ')}`);
  }
}

async function run() {
  // Test 1750: Marwar effective, Mewar effective, Sikh Empire inactive
  await testYear(1750, {
    "Kingdom of Marwar": "effective",
    "Kingdom of Mewar": "effective",
    "Sikh Empire": null,
  });

  // Test 1790: Marwar effective, Mewar weak, Sikh Empire inactive
  await testYear(1790, {
    "Kingdom of Marwar": "effective",
    "Kingdom of Mewar": "weak",
    "Sikh Empire": null,
  });

  // Test 1805: Marwar weak, Mewar weak, Sikh Empire effective
  await testYear(1805, {
    "Kingdom of Marwar": "weak",
    "Kingdom of Mewar": "weak",
    "Sikh Empire": "effective",
  });

  // Test 1818: all three active
  await testYear(1818, {
    "Kingdom of Marwar": "weak",
    "Kingdom of Mewar": "weak",
    "Sikh Empire": "effective",
  });

  await testEntityRoutes();
  console.log("\n=== ALL API SMOKE TESTS COMPLETED SUCCESSFULLY ===");
}

run().catch(console.error);
