// Bharat Through Time — Historical Story Data (1700–1820 CE)
// Strictly cross-referenced with database entities in events, polities, rulers, and places.

export const TIMELINE_WINDOW = {
  minYear: 1700,
  maxYear: 1820,
};

export const POWER_TIMELINES = [
  {
    id: "mughal",
    name: "Mughal Empire",
    actualStart: 1526,
    actualEnd: 1857,
    visibleStart: 1700,
    visibleEnd: 1820,
    continuesBefore: true, // Founded 1526 by Babur
    continuesAfter: true,  // Continues past 1820 until 1857
    lifespanLabel: "1526 – 1857",
    color: "#C28C40", // antique gold/ochre
    statusNote: "Pre-dates 1700; nominal paramountcy post-1759; continues until 1857",
  },
  {
    id: "maratha",
    name: "Maratha Confederacy",
    actualStart: 1674,
    actualEnd: 1818,
    visibleStart: 1700,
    visibleEnd: 1818,
    continuesBefore: true, // Founded 1674 by Shivaji
    continuesAfter: false, // Dissolved 1818 post-Third Anglo-Maratha War
    lifespanLabel: "1674 – 1818",
    color: "#A8523B", // terracotta
    statusNote: "Pre-dates 1700 (founded 1674); dissolved in 1818 after Third Anglo-Maratha War",
  },
  {
    id: "mysore",
    name: "Kingdom of Mysore",
    actualStart: 1399,
    actualEnd: 1950,
    visibleStart: 1700,
    visibleEnd: 1820,
    continuesBefore: true,  // Founded 1399 by Yaduraya Wodeyar
    continuesAfter: true,   // Continues as Princely State until 1950
    sultanateStart: 1761,   // Hyder Ali de facto sovereignty
    sultanateEnd: 1799,     // Fall of Srirangapatna / death of Tipu Sultan
    lifespanLabel: "1399 – 1950",
    sultanateLabel: "Sultanate 1761–1799",
    color: "#4D6B53", // deep antique green
    statusNote: "Founded 1399; autonomous Sultanate under Hyder Ali & Tipu Sultan 1761–1799; princely state to 1950",
  },
  {
    id: "nizam",
    name: "Nizam of Hyderabad",
    actualStart: 1724,
    actualEnd: 1948,
    visibleStart: 1724,
    visibleEnd: 1820,
    continuesBefore: false, // Founded 1724 by Asaf Jah I
    continuesAfter: true,   // Continues past 1820 until 1948
    lifespanLabel: "1724 – 1948",
    color: "#293E63", // indigo
    statusNote: "Founded 1724 by Asaf Jah I; subsidiary alliance from 1798; continues to 1948",
  },
  {
    id: "sikh",
    name: "Sikh Empire",
    actualStart: 1799,
    actualEnd: 1849,
    confederacyStart: 1707, // Preceded by Sikh Misls / Dal Khalsa 1707–1799
    visibleStart: 1799,
    visibleEnd: 1820,
    continuesBefore: false, // Unified empire under Ranjit Singh starts 1799 (preceded by misl confederacy)
    continuesAfter: true,   // Continues past 1820 until British annexation in 1849
    lifespanLabel: "1799 – 1849",
    color: "#B46522", // saffron ochre
    statusNote: "Unified 1799 by Maharaja Ranjit Singh (preceded by Sikh Misls 1707–1799); continues to 1849",
  },
];

export const STORIES = [
  {
    id: "rise-of-mysore",
    title: "The rise of Mysore",
    era: "1707 – 1801",
    totalChapters: 6,
    summary:
      "From the fragmentation following Aurangzeb's death to the climactic Anglo-Mysore Wars and the emergence of modern regional states.",
    chapters: [
      {
        id: "ch-1",
        number: 1,
        year: 1707,
        title: "Aurangzeb dies",
        dateString: "3 March 1707",
        location: "Ahmednagar, Deccan",
        coordinates: [19.09, 74.74],
        zoom: 6,
        summary:
          "Emperor Aurangzeb dies in Ahmednagar after 25 years of grueling Deccan warfare, triggering bitter Mughal succession wars and leaving peninsular India vulnerable to emerging regional powers.",
        causalChain: {
          becauseOf: {
            title: "Deccan Campaigns",
            year: 1681,
            description:
              "Decades of exhausting Deccan warfare bankrupted the imperial Mughal treasury and alienated regional nobility.",
          },
          thisChapter: {
            title: "Death of Aurangzeb",
            year: 1707,
            description:
              "Aurangzeb dies at Ahmednagar; centralized Mughal hegemony over the Deccan immediately fractures.",
          },
          ledTo: {
            title: "Maratha Expansion",
            year: 1720,
            description:
              "Imperial governors asserted de facto autonomy in Hyderabad and Bengal while Marathas launched rapid expansion.",
          },
        },
        keyFigures: [
          { name: "Aurangzeb", role: "Mughal Emperor (1658–1707, Wikidata Q48165)" },
          { name: "Bahadur Shah I", role: "Mughal Prince & Successor (reign 1707–1712)" },
        ],
        confidence: 94,
        confidenceRating: "High",
        confidenceNote:
          "High — verified database records and Wikidata (Q48165)",
        compareSuggestion: {
          yearA: 1707,
          yearB: 1761,
          label: "Compare 1707 and 1761 in Atlas",
        },
      },
      {
        id: "ch-2",
        number: 2,
        year: 1761,
        title: "Third Battle of Panipat",
        dateString: "14 January 1761",
        location: "Panipat, Haryana",
        coordinates: [29.39, 76.97],
        zoom: 6,
        summary:
          "Ahmad Shah Durrani's Afghan coalition crushes the Maratha army under Sadashivrao Bhau. With Maratha authority severely battered in the north, southern powers gain breathing room to consolidate.",
        causalChain: {
          becauseOf: {
            title: "Maratha Northward Push",
            year: 1758,
            description:
              "Maratha conquest of Punjab directly threatened the Afghan borders of Ahmad Shah Durrani.",
          },
          thisChapter: {
            title: "Third Battle of Panipat",
            year: 1761,
            description:
              "Sadashivrao Bhau's army suffered catastrophic defeat at Panipat with massive loss of commanders and cavalry.",
          },
          ledTo: {
            title: "Deccan Power Vacuum",
            year: 1761,
            description:
              "Temporary Maratha retraction from Karnataka created space for Hyder Ali to consolidate Mysore.",
          },
        },
        keyFigures: [
          { name: "Ahmad Shah Durrani", role: "King of Afghanistan (Wikidata Q170138)" },
          { name: "Sadashivrao Bhau", role: "Maratha Commander-in-Chief" },
        ],
        confidence: 95,
        confidenceRating: "High",
        confidenceNote:
          "High — verified database event (Q1259218)",
        compareSuggestion: {
          yearA: 1761,
          yearB: 1780,
          label: "Compare 1761 and 1780 in Atlas",
        },
      },
      {
        id: "ch-3",
        number: 3,
        year: 1761,
        title: "Hyder Ali takes Mysore",
        dateString: "1761 CE",
        location: "Srirangapatna, Karnataka",
        coordinates: [12.42, 76.68],
        zoom: 7,
        summary:
          "Hyder Ali, a brilliant military commander, outmaneuvers court ministers and deposes the Wodeyar prime ministers to become de facto ruler of Mysore, establishing a disciplined modernised artillery and rocket corps.",
        causalChain: {
          becauseOf: {
            title: "Wodeyar Internal Crisis",
            year: 1759,
            description:
              "Troop mutinies and Maratha tribute incursions weakened traditional Dalwai leadership in Mysore.",
          },
          thisChapter: {
            title: "Hyder Ali takes Mysore",
            year: 1761,
            description:
              "Hyder Ali assumes full de facto civil and military sovereignty over the Kingdom of Mysore.",
          },
          ledTo: {
            title: "Rise of Militarized Mysore",
            year: 1767,
            description:
              "Mysore transformed into the most formidable militarized artillery power in southern India.",
          },
        },
        keyFigures: [
          { name: "Hyder Ali", role: "Sultan (de facto ruler, 1761–1782, Wikidata Q1569078)" },
          { name: "Krishnaraja Wodeyar II", role: "Titular Maharaja of Mysore (1734–1766)" },
        ],
        confidence: 90,
        confidenceRating: "High",
        confidenceNote:
          "High — verified ruler record in database (reignStart 1761, Wikidata Q1569078)",
        compareSuggestion: {
          yearA: 1761,
          yearB: 1780,
          label: "Compare 1761 and 1780 in Atlas",
        },
      },
      {
        id: "ch-4",
        number: 4,
        year: 1780,
        title: "Battle of Pollilur",
        dateString: "10 September 1780",
        location: "Pullalur near Kanchipuram",
        coordinates: [12.98, 79.71],
        zoom: 7,
        summary:
          "A Mysore army under Hyder Ali and Tipu Sultan destroyed an East India Company detachment under Colonel William Baillie near Kanchipuram, using iron-cased Mysorean rockets to devastating effect.",
        causalChain: {
          becauseOf: {
            title: "Rise of Mysore under Hyder Ali",
            year: 1761,
            description:
              "Hyder Ali consolidated military control of Mysore, establishing modern rocket and artillery battalions.",
          },
          thisChapter: {
            title: "Battle of Pollilur",
            year: 1780,
            description:
              "A Mysore army under Hyder Ali destroyed an East India Company detachment near Kanchipuram.",
          },
          ledTo: {
            title: "Treaty of Mangalore",
            year: 1784,
            description:
              "Restored status quo ante bellum; concluded the Second Anglo-Mysore War on terms dictated by Mysore.",
          },
        },
        keyFigures: [
          { name: "Hyder Ali", role: "Sultan of Mysore" },
          { name: "William Baillie", role: "Colonel, British East India Company" },
        ],
        confidence: 95,
        confidenceRating: "High",
        confidenceNote:
          "High — well documented event (Database Event Q568613 & Pullalur Place Q7259405)",
        compareSuggestion: {
          yearA: 1739,
          yearB: 1780,
          label: "Compare 1739 and 1780 in Atlas",
        },
      },
      {
        id: "ch-5",
        number: 5,
        year: 1799,
        title: "Srirangapatna falls",
        dateString: "4 May 1799",
        location: "Srirangapatna Fortress",
        coordinates: [12.41, 76.69],
        zoom: 7,
        summary:
          "In the Fourth Anglo-Mysore War, a grand coalition of the British East India Company and the Nizam of Hyderabad storms the fortress of Srirangapatna. Tipu Sultan is killed in combat at the Water Gate.",
        causalChain: {
          becauseOf: {
            title: "French Alliance & Fourth Mysore War",
            year: 1798,
            description:
              "Tipu Sultan's diplomatic embassy to Revolutionary France prompted Lord Wellesley's preemptive campaign.",
          },
          thisChapter: {
            title: "Siege of Seringapatam",
            year: 1799,
            description:
              "British-allied forces breached the western walls; Tipu Sultan died sword in hand defending the fortress.",
          },
          ledTo: {
            title: "Partition & Wodeyar Restoration",
            year: 1799,
            description:
              "Mysore was partitioned and the Wodeyar dynasty restored under a British subsidiary alliance.",
          },
        },
        keyFigures: [
          { name: "Tipu Sultan", role: "Sultan of Mysore (1782–1799, Wikidata Q10088)" },
          { name: "Arthur Wellesley", role: "EIC Commander (future Duke of Wellington)" },
        ],
        confidence: 98,
        confidenceRating: "High",
        confidenceNote:
          "High — well documented event (Database Event Q815204 & Srirangapatna Place Q653988)",
        compareSuggestion: {
          yearA: 1780,
          yearB: 1799,
          label: "Compare 1780 and 1799 in Atlas",
        },
      },
      {
        id: "ch-6",
        number: 6,
        year: 1801,
        title: "Ranjit Singh crowned",
        dateString: "12 April 1801",
        location: "Lahore, Punjab",
        coordinates: [31.55, 74.35],
        zoom: 6,
        summary:
          "Maharaja Ranjit Singh is formally proclaimed Maharaja of Punjab at Lahore on Baisakhi day, uniting autonomous Sikh misls into the sovereign Sikh Empire and inaugurating a new northern power balance.",
        causalChain: {
          becauseOf: {
            title: "Capture of Lahore",
            year: 1799,
            description:
              "Ranjit Singh unified the Sukerchakia misl and captured the historic capital of Lahore in 1799.",
          },
          thisChapter: {
            title: "Ranjit Singh crowned",
            year: 1801,
            description:
              "Royal investiture as Maharaja of Punjab at Lahore, establishing the centralized Sikh Empire.",
          },
          ledTo: {
            title: "Treaty of Amritsar",
            year: 1809,
            description:
              "Fixed the Sutlej River as mutual boundary with British; opened unchecked northward and westward expansion.",
          },
        },
        keyFigures: [
          { name: "Ranjit Singh", role: "Maharaja of the Sikh Empire (1799–1839, Wikidata Q332620)" },
        ],
        confidence: 92,
        confidenceRating: "High",
        confidenceNote:
          "High — verified ruler record in database (reignStart 1799, crowned 1801) & Treaty of Amritsar (Q17035527)",
        compareSuggestion: {
          yearA: 1799,
          yearB: 1820,
          label: "Compare 1799 and 1820 in Atlas",
        },
      },
    ],
  },
  {
    id: "maratha-ascendancy",
    title: "The Maratha Ascendancy",
    era: "1720 – 1761",
    totalChapters: 4,
    summary:
      "Peshwa Baji Rao I and his successors transform the Maratha kingdom into an imperial confederacy spanning from the Deccan to Delhi.",
    chapters: [
      {
        id: "m-ch-1",
        number: 1,
        year: 1728,
        title: "Battle of Palkhed",
        dateString: "28 February 1728",
        location: "Palkhed, Maharashtra",
        coordinates: [19.98, 74.05],
        zoom: 6,
        summary:
          "Peshwa Baji Rao I outmaneuvers the Nizam-ul-Mulk in a masterclass of cavalry mobility, cutting his water supplies and forcing the Nizam to recognize Chhatrapati Shahu's authority.",
        causalChain: {
          becauseOf: {
            title: "Deccan Contestation",
            year: 1724,
            description:
              "Nizam-ul-Mulk sought to contest Shahu's legitimacy by backing Sambhaji II of Kolhapur.",
          },
          thisChapter: {
            title: "Battle of Palkhed",
            year: 1728,
            description:
              "Baji Rao surrounded and immobilized the Nizam's heavy forces at Palkhed without artillery confrontation.",
          },
          ledTo: {
            title: "Treaty of Shevgaon",
            year: 1728,
            description:
              "The Nizam formally conceded Shahu's supremacy and confirmed Maratha rights to collect chauth in the Deccan.",
          },
        },
        keyFigures: [
          { name: "Baji Rao I", role: "Maratha Peshwa (1720–1740)" },
          { name: "Asaf Jah I", role: "Nizam of Hyderabad (1724–1748)" },
        ],
        confidence: 93,
        confidenceRating: "High",
        confidenceNote: "High — well documented event in database records",
        compareSuggestion: {
          yearA: 1720,
          yearB: 1761,
          label: "Compare 1720 and 1761 in Atlas",
        },
      },
      {
        id: "m-ch-2",
        number: 2,
        year: 1737,
        title: "Battle of Bhopal",
        dateString: "24 December 1737",
        location: "Bhopal, Central India",
        coordinates: [23.25, 77.41],
        zoom: 6,
        summary:
          "Baji Rao besieges a joint imperial Mughal and Nizam army at Bhopal, securing undisputed Maratha sovereignty over the fertile province of Malwa.",
        causalChain: {
          becauseOf: {
            title: "Imperial Summons to Nizam",
            year: 1737,
            description:
              "Mughal court summoned the Nizam back to Delhi to lead a combined coalition against Maratha raids.",
          },
          thisChapter: {
            title: "Siege of Bhopal",
            year: 1737,
            description:
              "Maratha forces trapped the imperial coalition inside Bhopal fort, cutting all supply and reinforcements.",
          },
          ledTo: {
            title: "Convention of Doraha",
            year: 1738,
            description:
              "Malwa formally ceded to Marathas, opening the direct strategic corridor toward Delhi and the Doab.",
          },
        },
        keyFigures: [
          { name: "Baji Rao I", role: "Maratha Peshwa" },
          { name: "Asaf Jah I", role: "Nizam of Hyderabad" },
        ],
        confidence: 94,
        confidenceRating: "High",
        confidenceNote: "High — well documented event (Database Event Q4870477)",
        compareSuggestion: {
          yearA: 1737,
          yearB: 1761,
          label: "Compare 1737 and 1761 in Atlas",
        },
      },
      {
        id: "m-ch-3",
        number: 3,
        year: 1739,
        title: "Battle of Karnal & Sack of Delhi",
        dateString: "24 February 1739",
        location: "Karnal / Delhi",
        coordinates: [29.68, 76.99],
        zoom: 6,
        summary:
          "Nader Shah of Persia shatters the Mughal army in three hours, looting the Peacock Throne and exposing the utter weakness of the imperial centre.",
        causalChain: {
          becauseOf: {
            title: "Persian Advance",
            year: 1738,
            description:
              "Mughal refusal of diplomatic dispatches and shelter to Afghan fugitives provoked Nader Shah's advance.",
          },
          thisChapter: {
            title: "Battle of Karnal",
            year: 1739,
            description:
              "Catastrophic defeat of Emperor Muhammad Shah; devastating two-month occupation and sack of Delhi.",
          },
          ledTo: {
            title: "Imperial Vacuum",
            year: 1739,
            description:
              "Mughal prestige irreparably destroyed; provincial subahdars and Marathas stepped in to fill the absolute vacuum.",
          },
        },
        keyFigures: [
          { name: "Nader Shah", role: "Shahanshah of Persia" },
          { name: "Muhammad Shah", role: "Mughal Emperor" },
        ],
        confidence: 96,
        confidenceRating: "High",
        confidenceNote: "High — well documented event (Database Event Q2736986)",
        compareSuggestion: {
          yearA: 1739,
          yearB: 1761,
          label: "Compare 1739 and 1761 in Atlas",
        },
      },
      {
        id: "m-ch-4",
        number: 4,
        year: 1761,
        title: "Third Battle of Panipat",
        dateString: "14 January 1761",
        location: "Panipat, Haryana",
        coordinates: [29.39, 76.97],
        zoom: 6,
        summary:
          "The zenith and tragic shattering of Maratha imperial ambition in the north under Sadashivrao Bhau against Ahmad Shah Durrani.",
        causalChain: {
          becauseOf: {
            title: "Punjab Expansion",
            year: 1758,
            description:
              "Maratha conquest of Punjab and installation of a garrison at Attock directly threatened Afghan territory.",
          },
          thisChapter: {
            title: "Third Battle of Panipat",
            year: 1761,
            description:
              "Decisive defeat of Marathas with immense loss of generals, cavalry, and artillery at Panipat.",
          },
          ledTo: {
            title: "Decentralized Confederacy",
            year: 1761,
            description:
              "Power shifted toward semi-independent dynasties (Scindia, Holkar, Gaekwad) rather than a unified Peshwa empire.",
          },
        },
        keyFigures: [
          { name: "Ahmad Shah Durrani", role: "Durrani Emperor" },
          { name: "Sadashivrao Bhau", role: "Maratha General" },
        ],
        confidence: 95,
        confidenceRating: "High",
        confidenceNote: "High — well documented event (Database Event Q1259218)",
        compareSuggestion: {
          yearA: 1739,
          yearB: 1761,
          label: "Compare 1739 and 1761 in Atlas",
        },
      },
    ],
  },
];
