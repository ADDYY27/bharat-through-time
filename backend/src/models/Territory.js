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
  // representation: how strongly to visually communicate political control.
  // - "effective" (default): normal fill — polity actively controlled this area.
  // - "weak": faded fill — historical/nominal presence only; boundary is approximate.
  // NOTE: this is NOT the same as confidence. confidence = boundary reliability.
  //       representation = degree of political control being claimed.
  representation: { type: String, enum: ["effective", "weak"], default: "effective" },
  sources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Source" }],
});

territorySchema.index({ geometry: "2dsphere" });

export default mongoose.model("Territory", territorySchema);