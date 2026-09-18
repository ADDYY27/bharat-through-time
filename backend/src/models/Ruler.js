import mongoose from "mongoose";

const rulerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: String, // e.g. "Chhatrapati", "Peshwa", "Padshah" — or, for non-monarch
                  // figures like military commanders, a role description like
                  // "Commander, British East India Company"
  dynasty: String,
  reignStart: Number, // year, negative for BCE. For non-ruler figures, the
  reignEnd: Number,   // start/end of their period of active prominence/command.
  birthYear: Number,
  deathYear: Number,
  polity: { type: mongoose.Schema.Types.ObjectId, ref: "Polity" }, // null for
    // standalone/foreign figures (Nader Shah, Ahmad Shah Durrani) and for
    // non-ruler figures (Robert Clive) who never held one of our tracked polities
  places: [{ type: mongoose.Schema.Types.ObjectId, ref: "Place" }], // NEW:
    // direct links to notable associated places (capital ruled from, place
    // founded/built, site of a defining event, etc.) — manually curated,
    // not auto-derived from polity.capital, so it stays meaningful even
    // for non-ruler figures with no polity at all
  imageUrl: String,
  bio: String,
  sources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Source" }],
});

export default mongoose.model("Ruler", rulerSchema);
