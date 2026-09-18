import mongoose from "mongoose";

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["city", "capital", "fort", "monument", "trade_center", "battle_site", "other"], default: "city" },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  modernName: String,
  modernState: String,
  description: String,
  // Which polities have been notably associated with/controlled this place.
  // Manually curated, not auto-derived — control of a city often shifted
  // multiple times and shouldn't be inferred from territory polygons alone.
  polities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Polity" }],
  sources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Source" }],
});

placeSchema.index({ location: "2dsphere" });

export default mongoose.model("Place", placeSchema);
