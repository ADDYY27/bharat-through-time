import mongoose from "mongoose";

const territorySchema = new mongoose.Schema({
  polity: { type: mongoose.Schema.Types.ObjectId, ref: "Polity", required: true },
  validFrom: { type: Number, required: true }, // year
  validTo: { type: Number, required: true },
  geometry: {
    type: { type: String, enum: ["Polygon", "MultiPolygon"], required: true },
    coordinates: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  confidence: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  sources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Source" }],
});

territorySchema.index({ geometry: "2dsphere" });

export default mongoose.model("Territory", territorySchema);