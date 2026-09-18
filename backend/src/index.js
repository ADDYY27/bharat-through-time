import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import historyRoutes from "./routes/history.js";
import searchRoutes from "./routes/search.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", message: "Bharat Through Time API is alive" });
});

app.use("/api/history", historyRoutes);
app.use("/api/search", searchRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});