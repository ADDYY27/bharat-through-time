import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import historyRoutes from "./routes/history.js";
import searchRoutes from "./routes/search.js";

dotenv.config();
const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "OPTIONS"],
  })
);
app.use(express.json());

// ── Health and Ping Endpoints for Render / Monitoring ────────────────────────
const healthHandler = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", message: "Bharat Through Time API is alive" });
});

// ── Core Routes ─────────────────────────────────────────────────────────────
app.use("/api/history", historyRoutes);
app.use("/api/search", searchRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Graceful shutdown handling for Render zero-downtime restarts
  function gracefulShutdown(signal) {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await mongoose.connection.close(false);
        console.log("MongoDB connection closed.");
        process.exit(0);
      } catch {
        process.exit(1);
      }
    });
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
});