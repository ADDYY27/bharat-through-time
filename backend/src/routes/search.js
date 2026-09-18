import express from "express";
import Polity from "../models/Polity.js";
import Ruler from "../models/Ruler.js";
import Place from "../models/Place.js";
import Territory from "../models/Territory.js";
import Event from "../models/Event.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [polities, rulers, places, events] = await Promise.all([
      Polity.find({}, "name type period capital colorHex").populate("capital", "name"),
      Ruler.find(
        {},
        "name title polity reignStart reignEnd birthYear deathYear imageUrl bio places"
      )
        .populate("polity", "name colorHex")
        .populate("sources")
        .populate("places", "name type"),
      Place.find({}, "name type modernState polities").populate("polities", "name"),
      Event.find({}, "title type year description outcome polities rulers place")
        .populate("polities", "name colorHex")
        .populate("rulers", "name")
        .populate("place", "name")
        .populate("sources"),
    ]);

    const territories = await Territory.find({}, "polity validFrom validTo");
    const rangeByPolity = {};
    territories.forEach((t) => {
      const key = t.polity.toString();
      if (!rangeByPolity[key]) {
        rangeByPolity[key] = { validFrom: t.validFrom, validTo: t.validTo };
      } else {
        rangeByPolity[key].validFrom = Math.min(rangeByPolity[key].validFrom, t.validFrom);
        rangeByPolity[key].validTo = Math.max(rangeByPolity[key].validTo, t.validTo);
      }
    });

    function jumpYearForRuler(r) {
      const range = r.polity ? rangeByPolity[r.polity._id.toString()] : null;
      if (!range) return r.reignStart;
      return Math.max(r.reignStart, range.validFrom);
    }

    const results = [
      ...polities.map((p) => ({
        kind: "polity",
        id: p._id,
        label: p.name,
        sublabel: p.type.charAt(0).toUpperCase() + p.type.slice(1),
        jumpYear: rangeByPolity[p._id.toString()]?.validFrom || p.period?.start,
        polityId: p._id,
      })),
      ...rulers.map((r) => ({
        kind: "ruler",
        id: r._id,
        label: r.name,
        sublabel: r.polity?.name || r.title || "Historical figure",
        jumpYear: jumpYearForRuler(r),
        polityId: r.polity?._id,
        rulerId: r._id,
        // Full data so the frontend can show a standalone ruler view
        // without waiting on a year-scoped fetch:
        ruler: {
          _id: r._id,
          name: r.name,
          title: r.title,
          reignStart: r.reignStart,
          reignEnd: r.reignEnd,
          birthYear: r.birthYear,
          deathYear: r.deathYear,
          imageUrl: r.imageUrl,
          bio: r.bio,
          sources: r.sources,
          polity: r.polity,
          places: r.places,
        },
      })),
      ...places.map((p) => {
        const polityName = p.polities?.[0]?.name;
        const typeLabel = p.type.replace("_", " ");
        return {
          kind: "place",
          id: p._id,
          label: p.name,
          sublabel: polityName ? `${polityName} · ${typeLabel}` : typeLabel,
          jumpYear: null,
          polityId: p.polities?.[0]?._id || null,
        };
      }),
      ...events.map((e) => ({
        kind: "event",
        id: e._id,
        label: e.title,
        sublabel: `${e.year} · ${e.type.charAt(0).toUpperCase() + e.type.slice(1)}`,
        jumpYear: e.year,
        polityId: e.polities?.[0]?._id || null,
        event: {
          _id: e._id,
          title: e.title,
          type: e.type,
          year: e.year,
          description: e.description,
          outcome: e.outcome,
          polities: e.polities,
          rulers: e.rulers,
          place: e.place,
          sources: e.sources,
        },
      })),
    ];

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
