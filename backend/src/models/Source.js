import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: String,
  type: { type: String, enum: ["book", "wikipedia", "wikidata", "academic_paper", "map_atlas", "other"], default: "other" },
  url: String,
  publisher: String,
  year: Number,
  notes: String,
});

export default mongoose.model("Source", sourceSchema);