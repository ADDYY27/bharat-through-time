import express from "express";
import Territory from "../models/Territory.js";
import Polity from "../models/Polity.js";
import Ruler from "../models/Ruler.js";
import Event from "../models/Event.js";
import Place from "../models/Place.js";
import Source from "../models/Source.js";

const router = express.Router();

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
