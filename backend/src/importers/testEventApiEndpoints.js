// backend/src/importers/testEventApiEndpoints.js
// Run with: node src/importers/testEventApiEndpoints.js

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("==================================================");
  console.log("Testing API Endpoints for Phase 3B.3 Events");
  console.log("==================================================");

  let errorCount = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`  ❌ FAIL: ${message}`);
      errorCount++;
    } else {
      console.log(`  ✅ PASS: ${message}`);
    }
  }

  // 1. Test 1787 → Tunga/Lalsot
  console.log("\n--- Testing Year 1787 (Battle of Tunga / Lalsot) ---");
  const res1787 = await fetch(`${BASE_URL}/api/history/1787`);
  assert(res1787.ok, "GET /api/history/1787 returns HTTP 200");
  const data1787 = await res1787.json();
  const tungaInEvents = data1787.events?.find(e => e.title.includes("Tunga"));
  assert(tungaInEvents != null, "Battle of Tunga / Lalsot present in year 1787 events");
  if (tungaInEvents) {
    assert(tungaInEvents.year === 1787, "Tunga year is 1787");
    assert(tungaInEvents.place?.name === "Lalsot", "Tunga place is Lalsot");
    assert(tungaInEvents.rulers?.length === 3, "Tunga rulers count is 3");
  }

  const ov1787 = await (await fetch(`${BASE_URL}/api/history/1787/overview`)).json();
  const tungaInOv = ov1787.events?.find(e => e.title.includes("Tunga"));
  assert(tungaInOv && tungaInOv.isExact === true, "Tunga in 1787 overview has isExact === true");

  // 2. Test 1790 → Merta
  console.log("\n--- Testing Year 1790 (Battle of Merta) ---");
  const res1790 = await fetch(`${BASE_URL}/api/history/1790`);
  assert(res1790.ok, "GET /api/history/1790 returns HTTP 200");
  const data1790 = await res1790.json();
  const mertaInEvents = data1790.events?.find(e => e.title.includes("Merta"));
  assert(mertaInEvents != null, "Battle of Merta present in year 1790 events");
  if (mertaInEvents) {
    assert(mertaInEvents.year === 1790, "Merta year is 1790");
    assert(mertaInEvents.place?.name === "Merta City", "Merta place is Merta City");
    assert(mertaInEvents.rulers?.length === 2, "Merta rulers count is 2");
  }

  const ov1790 = await (await fetch(`${BASE_URL}/api/history/1790/overview`)).json();
  const mertaInOv = ov1790.events?.find(e => e.title.includes("Merta"));
  assert(mertaInOv && mertaInOv.isExact === true, "Merta in 1790 overview has isExact === true");

  // 3. Test 1809 → Treaty of Amritsar
  console.log("\n--- Testing Year 1809 (Treaty of Amritsar) ---");
  const res1809 = await fetch(`${BASE_URL}/api/history/1809`);
  assert(res1809.ok, "GET /api/history/1809 returns HTTP 200");
  const data1809 = await res1809.json();
  const amritsarInEvents = data1809.events?.find(e => e.title === "Treaty of Amritsar");
  assert(amritsarInEvents != null, "Treaty of Amritsar present in year 1809 events");
  if (amritsarInEvents) {
    assert(amritsarInEvents.year === 1809, "Amritsar treaty year is 1809");
    assert(amritsarInEvents.place?.name === "Amritsar", "Amritsar treaty place is Amritsar");
    assert(amritsarInEvents.rulers?.length === 1, "Amritsar treaty ruler count is 1 (Ranjit Singh)");
  }

  const ov1809 = await (await fetch(`${BASE_URL}/api/history/1809/overview`)).json();
  const amritsarInOv = ov1809.events?.find(e => e.title === "Treaty of Amritsar");
  assert(amritsarInOv && amritsarInOv.isExact === true, "Treaty of Amritsar in 1809 overview has isExact === true");

  // 4. Test 1818 → Treaty of Jodhpur + Treaty of Udaipur
  console.log("\n--- Testing Year 1818 (Treaties of Jodhpur & Udaipur) ---");
  const res1818 = await fetch(`${BASE_URL}/api/history/1818`);
  assert(res1818.ok, "GET /api/history/1818 returns HTTP 200");
  const data1818 = await res1818.json();
  const jodhpurInEvents = data1818.events?.find(e => e.title.includes("Jodhpur"));
  assert(jodhpurInEvents != null, "Treaty of Jodhpur present in year 1818 events");
  if (jodhpurInEvents) {
    assert(jodhpurInEvents.place?.name === "Jodhpur", "Jodhpur treaty place is Jodhpur");
  }

  const udaipurInEvents = data1818.events?.find(e => e.title.includes("Udaipur"));
  assert(udaipurInEvents != null, "Treaty of Udaipur present in year 1818 events");
  if (udaipurInEvents) {
    assert(udaipurInEvents.place?.name === "Udaipur", "Udaipur treaty place is Udaipur");
  }

  const ov1818 = await (await fetch(`${BASE_URL}/api/history/1818/overview`)).json();
  const jodhpurInOv = ov1818.events?.find(e => e.title.includes("Jodhpur"));
  const udaipurInOv = ov1818.events?.find(e => e.title.includes("Udaipur"));
  assert(jodhpurInOv && jodhpurInOv.isExact === true, "Treaty of Jodhpur in 1818 overview has isExact === true");
  assert(udaipurInOv && udaipurInOv.isExact === true, "Treaty of Udaipur in 1818 overview has isExact === true");

  // 5. Test Event Detail Routes (/api/history/event/:id)
  console.log("\n--- Testing Event Detail Routes (/api/history/event/:id) ---");
  const eventsToTest = [tungaInEvents, mertaInEvents, amritsarInEvents, jodhpurInEvents, udaipurInEvents];
  for (const ev of eventsToTest) {
    if (!ev?._id) continue;
    const res = await fetch(`${BASE_URL}/api/history/event/${ev._id}`);
    assert(res.ok, `GET /api/history/event/${ev._id} (${ev.title}) returns HTTP 200`);
    const detail = await res.json();
    assert(detail.title === ev.title, `Detail title matches: ${detail.title}`);
    assert(detail.place != null && detail.place.name != null, `Detail populated place: ${detail.place?.name}`);
    assert(detail.polities?.length >= 1, `Detail populated polities: ${detail.polities?.map(p=>p.name).join(", ")}`);
    assert(detail.rulers?.length >= 1, `Detail populated rulers: ${detail.rulers?.map(r=>r.name).join(", ")}`);
    assert(detail.sources?.length >= 1, `Detail populated sources: ${detail.sources?.length} sources`);
  }

  // 6. Test Place Reverse-Lookup Routes (/api/history/place/:id)
  console.log("\n--- Testing Place Reverse-Lookup Routes (/api/history/place/:id) ---");
  const placesToCheck = [
    { name: "Lalsot", eventTitle: "Battle of Tunga / Lalsot" },
    { name: "Merta City", eventTitle: "Battle of Merta" },
    { name: "Amritsar", eventTitle: "Treaty of Amritsar" },
    { name: "Jodhpur", eventTitle: "Treaty of Jodhpur / Marwar Subsidiary Alliance" },
    { name: "Udaipur", eventTitle: "Treaty of Udaipur / Mewar Subsidiary Alliance" },
  ];

  for (const item of placesToCheck) {
    const placeDoc = data1787.places?.find(p => p.name === item.name) ||
                     data1818.places?.find(p => p.name === item.name);
    assert(placeDoc != null, `Place "${item.name}" found in places collection`);
    if (placeDoc) {
      const pRes = await fetch(`${BASE_URL}/api/history/place/${placeDoc._id}`);
      assert(pRes.ok, `GET /api/history/place/${placeDoc._id} (${item.name}) returns HTTP 200`);
      const pData = await pRes.json();
      assert(pData.place?.name === item.name, `Place name matches: ${pData.place?.name}`);
      const reverseEvent = pData.events?.find(e => e.title === item.eventTitle);
      assert(reverseEvent != null, `Reverse-lookup events at "${item.name}" contains "${item.eventTitle}"`);
    }
  }

  console.log("\n==================================================");
  if (errorCount === 0) {
    console.log("ALL API TESTS PASSED (0 errors)");
  } else {
    console.error(`API TESTS FAILED: ${errorCount} errors detected.`);
    process.exit(1);
  }
  console.log("==================================================");
}

runTests().catch(err => {
  console.error("FATAL ERROR in testEventApiEndpoints:", err);
  process.exit(1);
});
