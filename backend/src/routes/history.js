import express from "express";
import Territory from "../models/Territory.js";
import Polity from "../models/Polity.js";
import Ruler from "../models/Ruler.js";
import Event from "../models/Event.js";
import Place from "../models/Place.js";
import Source from "../models/Source.js";

const router = express.Router();

// ── Entity-by-id detail routes ──────────────────────────────────────────────

// GET /api/history/event/:id
router.get("/event/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("polities", "name colorHex type")
      .populate("rulers", "name title reignStart reignEnd imageUrl polity")
      .populate({
        path: "rulers",
        populate: { path: "polity", select: "name colorHex" },
      })
      .populate("place", "name type location modernState description")
      .populate("sources");
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/place/:id — includes reverse lookup: events at this place
router.get("/place/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id)
      .populate("polities", "name colorHex type")
      .populate("sources");
    if (!place) return res.status(404).json({ error: "Place not found" });

    // Reverse lookup: events whose place field points here
    const events = await Event.find({ place: place._id })
      .populate("polities", "name colorHex")
      .populate("rulers", "name title");

    // Reverse lookup: rulers whose places array includes this place
    const rulers = await Ruler.find({ places: place._id })
      .populate("polity", "name colorHex");

    res.json({ place, events, rulers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/ruler/:id — includes reverse lookup: events featuring this ruler
router.get("/ruler/:id", async (req, res) => {
  try {
    const ruler = await Ruler.findById(req.params.id)
      .populate("polity", "name colorHex type period")
      .populate("places", "name type location modernState")
      .populate("sources");
    if (!ruler) return res.status(404).json({ error: "Ruler not found" });

    // Reverse lookup: events where this ruler appears in the rulers array
    const events = await Event.find({ rulers: ruler._id })
      .populate("polities", "name colorHex")
      .populate("place", "name type location");

    res.json({ ruler, events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/polity/:id — polity detail with related data
router.get("/polity/:id", async (req, res) => {
  try {
    const polity = await Polity.findById(req.params.id)
      .populate("capital", "name type location modernState")
      .populate("sources");
    if (!polity) return res.status(404).json({ error: "Polity not found" });

    // All rulers of this polity
    const rulers = await Ruler.find({ polity: polity._id })
      .sort({ reignStart: 1 })
      .populate("places", "name type");

    // All events involving this polity
    const events = await Event.find({ polities: polity._id })
      .populate("place", "name type location")
      .populate("rulers", "name title");

    // Territory range for this polity
    const territories = await Territory.find({ polity: polity._id })
      .sort({ validFrom: 1 })
      .select("validFrom validTo confidence");

    res.json({ polity, rulers, events, territories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Year-scoped history route ────────────────────────────────────────────────

// GET /api/history/:year/overview — lightweight summary for Year Overview panel
// Must be registered BEFORE /:year to avoid route conflict.
router.get("/:year/overview", async (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

  const EVENT_WINDOW = 18; // mirrors frontend constant

  try {
    // Active territories → active polity IDs
    const territories = await Territory.find({
      validFrom: { $lte: year },
      validTo: { $gte: year },
    }).populate("polity", "name colorHex type");

    const polityIds = territories.map((t) => t.polity?._id).filter(Boolean);

    // Active rulers: ruling one of the active polities AND reign covers this year
    const rulers = await Ruler.find({
      polity: { $in: polityIds },
      reignStart: { $lte: year },
      reignEnd: { $gte: year },
    })
      .select("name title reignStart reignEnd imageUrl polity")
      .populate("polity", "name colorHex");

    // Contextual events: belong to an active polity AND within EVENT_WINDOW of year
    const contextualEvents = await Event.find({
      polities: { $in: polityIds },
      year: { $gte: year - EVENT_WINDOW, $lte: year + EVENT_WINDOW },
    })
      .select("title year type place rulers polities")
      .populate("place", "name type")
      .populate("rulers", "name title")
      .populate("polities", "name colorHex");

    // Tag each event: isExact = true when event.year === selected year
    const events = contextualEvents.map((ev) => ({
      ...ev.toObject(),
      isExact: ev.year === year,
    }));

    // Total places count (all recorded places — not year-scoped)
    const placeCount = await Place.countDocuments();

    // Minimal polity list for the overview
    const polities = territories.map((t) => ({
      _id: t.polity._id,
      name: t.polity.name,
      colorHex: t.polity.colorHex,
      type: t.polity.type,
    }));

    res.json({
      year,
      counts: {
        polities: polities.length,
        rulers: rulers.length,
        events: events.length,
        places: placeCount,
      },
      polities,
      rulers,
      events,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/:year
router.get("/:year", async (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year)) return res.status(400).json({ error: "Invalid year" });

  try {
    const territories = await Territory.find({
      validFrom: { $lte: year },
      validTo: { $gte: year },
    })
      .populate({
        path: "polity",
        populate: [{ path: "capital" }, { path: "sources" }],
      })
      .populate("sources");

    const polityIds = territories.map((t) => t.polity._id);

    const rulers = await Ruler.find({
      polity: { $in: polityIds },
      reignStart: { $lte: year },
      reignEnd: { $gte: year },
    }).populate("sources").populate("places");

    const events = await Event.find({
      polities: { $in: polityIds },
    }).populate("place").populate("rulers");

    // Places: capitals of currently-active polities are always shown.
    // (A place can later be shown independently of any polity too, e.g. trade centres.)
    // Places are a foundational layer (not subordinate to which polity
    // currently controls them) — shown whenever the Cities layer is on,
    // regardless of political affiliation. A trade city or fort mattered
    // whether or not it's tagged as "belonging" to an active polity right now.
    const places = await Place.find({}).populate("sources").populate("polities", "name colorHex");

    res.json({ year, territories, rulers, events, places });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
