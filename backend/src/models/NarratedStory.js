import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    heading: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    year: { type: Number },
    entityRefs: [{ type: String }],
  },
  { _id: false }
);

const factSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const timelineNodeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    position: { type: Number, required: true, min: 0, max: 1 },
    chapterOrder: { type: Number, required: true },
  },
  { _id: false }
);

const linkedEntitySchema = (refModel) =>
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: refModel,
        default: null,
      },
      qid: { type: String, default: null, trim: true },
    },
    { _id: false }
  );

const narratedStorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["civilisation", "war", "empire", "faith", "trade"],
      index: true,
    },
    period: {
      startYear: { type: Number, required: true, index: true },
      endYear: { type: Number, required: true },
      label: { type: String, required: true, trim: true },
    },
    region: { type: String, required: true, trim: true },
    deck: { type: String, required: true, trim: true },
    readMinutes: { type: Number, required: true, default: 5 },
    chapters: [chapterSchema],
    keyIdea: {
      chapterOrder: { type: Number },
      text: { type: String, trim: true },
    },
    facts: {
      type: [factSchema],
      validate: [
        (val) => val.length <= 4,
        "{PATH} exceeds the limit of 4 at-a-glance facts",
      ],
    },
    timelineNodes: [timelineNodeSchema],
    links: {
      places: [linkedEntitySchema("Place")],
      people: [linkedEntitySchema("Ruler")],
      polities: [linkedEntitySchema("Polity")],
      events: [linkedEntitySchema("Event")],
    },
    relatedStories: [{ type: String, trim: true }],
    sources: [
      {
        title: { type: String, required: true, trim: true },
        url: { type: String, trim: true },
        _id: false,
      },
    ],
    confidence: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    confidenceNote: { type: String, trim: true },
    locator: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon", "Point"],
        default: "Polygon",
      },
      coordinates: { type: Array, default: [] },
    },
    onMap: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compute onMap based on atlas range (1700–1820)
narratedStorySchema.pre("save", function () {
  if (this.period && typeof this.period.startYear === "number" && typeof this.period.endYear === "number") {
    this.onMap = this.period.startYear <= 1820 && this.period.endYear >= 1700;
  }
});

// Text index for search
narratedStorySchema.index(
  { title: "text", deck: "text", region: "text" },
  { weights: { title: 5, deck: 2, region: 1 } }
);

export default mongoose.model("NarratedStory", narratedStorySchema);
