import mongoose from "mongoose";

const politySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["empire", "kingdom", "confederacy", "sultanate", "chiefdom", "colonial_territory", "other"], default: "kingdom" },
  period: {
    start: Number,
    end: Number,
  },
  capital: { type: mongoose.Schema.Types.ObjectId, ref: "Place" },
  description: String,
  colorHex: { type: String, default: "#cc6633" }, // for map rendering
  sources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Source" }],
});

export default mongoose.model("Polity", politySchema);