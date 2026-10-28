import express from "express";
import NarratedStory from "../models/NarratedStory.js";

const router = express.Router();

const VALID_CATEGORIES = ["civilisation", "war", "empire", "faith", "trade"];
const VALID_ERAS = ["ancient", "classical", "medieval", "early-modern", "early_modern"];
const VALID_SORTS = ["chronological", "latest", "alphabetical"];

function getEraRange(era) {
  const normalized = era.toLowerCase().replace(/_/g, "-");
  switch (normalized) {
    case "ancient":
      // Ancient: before -500 BCE
      return { "period.startYear": { $lt: -500 } };
    case "classical":
      // Classical: -500 through 600 CE
      return { "period.startYear": { $gte: -500, $lte: 600 } };
    case "medieval":
      // Medieval: 600 through 1500 CE
      return { "period.startYear": { $gt: 600, $lte: 1500 } };
    case "early-modern":
      // Early modern: 1500 through 1820 CE
      return { "period.startYear": { $gt: 1500, $lte: 1820 } };
    default:
      return null;
  }
}

// ── GET /api/stories/counts ──────────────────────────────────────────────────
// Returns counts by category and era for filter chips (published only)
router.get("/counts", async (req, res, next) => {
  try {
    const publishedFilter = { status: "published" };

    const [total, civilisation, war, empire, faith, trade, ancient, classical, medieval, earlyModern] =
      await Promise.all([
        NarratedStory.countDocuments(publishedFilter),
        NarratedStory.countDocuments({ ...publishedFilter, category: "civilisation" }),
        NarratedStory.countDocuments({ ...publishedFilter, category: "war" }),
        NarratedStory.countDocuments({ ...publishedFilter, category: "empire" }),
        NarratedStory.countDocuments({ ...publishedFilter, category: "faith" }),
        NarratedStory.countDocuments({ ...publishedFilter, category: "trade" }),
        NarratedStory.countDocuments({ ...publishedFilter, "period.startYear": { $lt: -500 } }),
        NarratedStory.countDocuments({ ...publishedFilter, "period.startYear": { $gte: -500, $lte: 600 } }),
        NarratedStory.countDocuments({ ...publishedFilter, "period.startYear": { $gt: 600, $lte: 1500 } }),
        NarratedStory.countDocuments({ ...publishedFilter, "period.startYear": { $gt: 1500, $lte: 1820 } }),
      ]);

    res.json({
      total,
      byCategory: {
        civilisation,
        war,
        empire,
        faith,
        trade,
      },
      byEra: {
        ancient,
        classical,
        medieval,
        "early-modern": earlyModern,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/stories ─────────────────────────────────────────────────────────
// Lightweight cards without chapter bodies (published only)
router.get("/", async (req, res, next) => {
  try {
    const { category, era, q, sort = "chronological", page = 1, limit = 12 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: "Page must be a positive integer" });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: "Limit must be a positive integer between 1 and 100" });
    }

    const filter = { status: "published" };

    if (category) {
      const catNorm = category.toLowerCase().trim();
      if (!VALID_CATEGORIES.includes(catNorm)) {
        return res.status(400).json({
          error: `Invalid category: '${category}'. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        });
      }
      filter.category = catNorm;
    }

    if (era) {
      const eraFilter = getEraRange(era);
      if (!eraFilter) {
        return res.status(400).json({
          error: `Invalid era: '${era}'. Must be one of: ancient, classical, medieval, early-modern`,
        });
      }
      Object.assign(filter, eraFilter);
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      // Use case-insensitive regex across title, deck, region
      filter.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { deck: { $regex: searchTerm, $options: "i" } },
        { region: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (sort && !VALID_SORTS.includes(sort)) {
      return res.status(400).json({
        error: `Invalid sort: '${sort}'. Must be one of: ${VALID_SORTS.join(", ")}`,
      });
    }

    let sortObj = { "period.startYear": 1 };
    if (sort === "latest") {
      sortObj = { "period.startYear": -1 };
    } else if (sort === "alphabetical") {
      sortObj = { title: 1 };
    }

    const skip = (pageNum - 1) * limitNum;

    // Use aggregation to return chapterCount without sending full chapter bodies
    const [results, total] = await Promise.all([
      NarratedStory.aggregate([
        { $match: filter },
        { $sort: sortObj },
        { $skip: skip },
        { $limit: limitNum },
        {
          $project: {
            slug: 1,
            title: 1,
            category: 1,
            period: 1,
            region: 1,
            deck: 1,
            readMinutes: 1,
            confidence: 1,
            confidenceNote: 1,
            locator: 1,
            onMap: 1,
            facts: 1,
            chapterCount: { $size: { $ifNull: ["$chapters", []] } },
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]),
      NarratedStory.countDocuments(filter),
    ]);

    res.json({
      stories: results,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/stories/:slug ───────────────────────────────────────────────────
// Full story detail with chapters, timelineNodes, sources, populated entities
router.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;

    const story = await NarratedStory.findOne({
      slug: slug.toLowerCase().trim(),
      status: "published",
    })
      .populate("links.places.entityId", "name type location modernState description")
      .populate("links.people.entityId", "name title reignStart reignEnd polity imageUrl")
      .populate("links.polities.entityId", "name type colorHex period capital")
      .populate("links.events.entityId", "title year type description");

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Also find the next published story chronologically for bottom recommendation
    const nextStory = await NarratedStory.findOne({
      status: "published",
      "period.startYear": { $gt: story.period.startYear },
    })
      .sort({ "period.startYear": 1 })
      .select("slug title category period readMinutes deck");

    const storyObj = story.toObject();
    storyObj.nextStory = nextStory || null;

    res.json(storyObj);
  } catch (err) {
    next(err);
  }
});

export default router;
