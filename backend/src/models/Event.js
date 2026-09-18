import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["battle", "treaty", "succession", "founding", "conquest", "other"], default: "other" },
  year: { type: Number, required: true },
  description: String,
  polities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Polity" }],
  rulers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ruler" }],
  place: { type: mongoose.Schema.Types.ObjectId, ref: "Place" },
  outcome: String,
  sources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Source" }],
});

export default mongoose.model("Event", eventSchema);
