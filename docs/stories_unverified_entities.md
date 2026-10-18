# Unresolved Entities in Explore Stories

This document logs entities referenced in **Explore Stories** that do not currently have corresponding records in the primary historical atlas database (which currently indexes historical entities for the 1700–1820 CE window).

As per project guidelines, these entities are rendered with `entityId: null` in story payloads and displayed as plain, non-clickable chips in the frontend until verified records exist in the database.

---

## 1. Indus Valley Civilisation (`indus-valley-civilisation`)

| Entity Name | Entity Type | Database Status | Verified Wikidata QID | Historical & Geographic Context |
|:---|:---|:---|:---|:---|
| **Harappa** | Place (Archaeological Site) | `null` | [Q174780](https://www.wikidata.org/wiki/Q174780) | Sahiwal District, Punjab, Pakistan (30.6300° N, 72.8667° E). Major urban center of the Mature Harappan phase. |
| **Mohenjo-daro** | Place (Archaeological Site) | `null` | [Q5725](https://www.wikidata.org/wiki/Q5725) | Larkana District, Sindh, Pakistan (27.3294° N, 68.1389° E). UNESCO World Heritage Site; prominent citadel and lower city. |
| **Dholavira** | Place (Archaeological Site) | `null` | [Q1207693](https://www.wikidata.org/wiki/Q1207693) | Khadir bet, Rann of Kutch, Gujarat, India (23.8869° N, 70.2131° E). Renowned for sophisticated water reservoirs and monumental stone architecture. |
| **Mehrgarh** | Place (Archaeological Site) | `null` | [Q735391](https://www.wikidata.org/wiki/Q735391) | Kacchi Plain, Balochistan, Pakistan (29.2139° N, 67.6167° E). Precursor Neolithic/Chalcolithic farming settlement dating from c. 7000 BCE. |
| **Lothal** | Place (Archaeological Site) | `null` | [Q737895](https://www.wikidata.org/wiki/Q737895) | Bhal region, Gujarat, India (22.5256° N, 72.2483° E). Southern outpost known for its tidal dockyard, bead factories, and maritime trade. |
| **Rakhigarhi** | Place (Archaeological Site) | `null` | [Q2726665](https://www.wikidata.org/wiki/Q2726665) | Hisar District, Haryana, India (29.2900° N, 76.1100° E). One of the largest Harappan sites, spanning early to late phases. |

---

## 2. Alexander and Porus — The Hydaspes (`alexander-and-porus`)

| Entity Name | Entity Type | Database Status | Verified Wikidata QID | Historical & Geographic Context |
|:---|:---|:---|:---|:---|
| **Alexander the Great** | Person (Ruler / Commander) | `null` | [Q8409](https://www.wikidata.org/wiki/Q8409) | King of Macedon (356–323 BCE); led campaign into northwestern Indian subcontinent (327–325 BCE). |
| **Porus** | Person (Ruler) | `null` | [Q272990](https://www.wikidata.org/wiki/Q272990) | King of the Pauravas (reigned 4th century BCE) between the Hydaspes (Jhelum) and Acesines (Chenab). |
| **Ambhi of Taxila** | Person (Ruler) | `null` | [Q4741499](https://www.wikidata.org/wiki/Q4741499) | Ruler of Taxila (Omphis in Greek sources); allied with Alexander against Porus in 326 BCE. |
| **Jhelum river (Hydaspes)** | Place (Geographic / River) | `null` | [Q14115](https://www.wikidata.org/wiki/Q14115) | River in northern Punjab; site of the Battle of the Hydaspes in 326 BCE. |
| **Taxila** | Place (City / Archaeological Site) | `null` | [Q156201](https://www.wikidata.org/wiki/Q156201) | Rawalpindi District, Punjab, Pakistan (33.7461° N, 72.8286° E). Major ancient center of learning, trade, and politics. |
| **Beas river (Hyphasis)** | Place (Geographic / River) | `null` | [Q335359](https://www.wikidata.org/wiki/Q335359) | River in Punjab and Himachal Pradesh; easternmost boundary of Alexander's campaign where his army mutinied. |

---

## 3. Draft Story Candidate Entities (For Future Ingestion)

The following entities are referenced in draft stubs:

- **Ashoka**: [Q8549](https://www.wikidata.org/wiki/Q8549) (Maurya Emperor, r. 268–232 BCE).
- **Kalinga**: [Q1255848](https://www.wikidata.org/wiki/Q1255848) (Ancient historical region in coastal Odisha/Andhra).
- **Chandragupta Maurya**: [Q188544](https://www.wikidata.org/wiki/Q188544) (Founder of Maurya Empire).
- **Rajendra Chola I**: [Q505436](https://www.wikidata.org/wiki/Q505436) (Chola Emperor, r. 1014–1044 CE).
- **Hyder Ali**: [Q379650](https://www.wikidata.org/wiki/Q379650) (Ruler of Mysore, 1761–1782 CE). *Note: Kingdom of Mysore is present in the database, but Hyder Ali as an individual ruler profile is currently candidate for ingest.*

---

## Ingestion Checklist for Atlas Expansion

When expanding the atlas schema beyond 1700–1820:
1. Create Place entities with verified GeoJSON points.
2. Ingest verified Wikidata QIDs and multilingual labels.
3. Link entities by re-running `npm run import:stories` to automatically populate `entityId` references via regex name matching.
