import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Load .env immediately so imported modules see env vars during evaluation
dotenv.config();

// Configure Cloudinary here, once
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Log presence of Cloudinary env variables for debugging (mask sensitive parts)
if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_CLOUD_NAME) {
  console.log("[DEBUG] Cloudinary env present: cloud_name=", process.env.CLOUDINARY_CLOUD_NAME);
} else if (process.env.CLOUDINARY_URL) {
  console.log("[DEBUG] Cloudinary URL env present (CLOUDINARY_URL)");
} else {
  console.warn("[WARN] Cloudinary credentials not fully set. Set CLOUD_NAME/CLOUD_API_KEY/CLOUD_API_SECRET or CLOUDINARY_URL in .env");
}

import { Server } from "socket.io";
import http from "http";
import path from "path";

// Routes
import authRoutes from "./routes/auth.js";
import lectureRoutes from "./routes/lectures.js"; // Handles Cloudinary PDF uploads
import quizRoutes from "./routes/quiz.js";
import pdfRoutes from "./routes/pdf.js"; // Fetch PDFs for students
import studentQuizRoutes from "./routes/studentQuiz.js";

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO setup (chat + WebRTC signaling)
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static frontend (HTML/CSS/JS in /public)
app.use(express.static("public"));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/student-quiz", studentQuizRoutes);

// -------------------
// ✅ WebRTC Signaling
// -------------------
let broadcasterId = null;

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // Broadcaster announces itself
  socket.on("startBroadcast", () => {
    broadcasterId = socket.id;
    console.log("🎤 Broadcaster started:", broadcasterId);
  });

  // Viewer joins broadcast
  socket.on("joinBroadcast", () => {
    if (broadcasterId) {
      io.to(broadcasterId).emit("viewerJoined", { viewerId: socket.id });
      console.log("👀 Viewer joined:", socket.id);
    }
  });

  // Broadcaster → specific viewer (offer + ICE)
  socket.on("webrtcOffer", ({ target, offer }) => {
    io.to(target).emit("webrtcOffer", { offer });
  });

  socket.on("webrtcIceCandidate", ({ target, candidate }) => {
    io.to(target).emit("webrtcIceCandidate", { viewerId: socket.id, candidate });
  });

  // Viewer → broadcaster (answer + ICE)
  socket.on("webrtcAnswer", ({ answer }) => {
    if (broadcasterId) {
      io.to(broadcasterId).emit("webrtcAnswer", { viewerId: socket.id, answer });
    }
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    if (socket.id === broadcasterId) {
      broadcasterId = null;
      console.log("🛑 Broadcaster stopped");
    }
  });
});

// ✅ Root endpoint
app.get("/", (req, res) => res.send("🚀 Gram-Vidya Server Running ✅"));

// ✅ MongoDB connection: retry primary MONGO_URI until Atlas is available
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectToAtlasWithRetry({ intervalMs = 15000 } = {}) {
  if (process.env.SKIP_DB === "true") {
    console.warn("[WARN] SKIP_DB=true — skipping MongoDB connection (development mode)");
    return;
  }

  if (!process.env.MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is undefined. Set MONGO_URI or use SKIP_DB=true to skip DB.");
    return;
  }

  const redact = (s) => (typeof s === "string" ? s.replace(/(:[^@]+)@/, ":[REDACTED]@") : s);
  console.log("[DEBUG] Will attempt connecting to Atlas using MONGO_URI:", redact(process.env.MONGO_URI));

  while (true) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connected (Atlas)");
      break;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      console.error("❌ MongoDB connection attempt failed:", msg);
      console.log(`🔁 Retrying in ${intervalMs / 1000}s... (will keep retrying until Atlas is available)`);
      await sleep(intervalMs);
    }
  }
}

// start retry loop in background so server can start immediately
connectToAtlasWithRetry().catch((e) => console.error("Unexpected Mongo connect error:", e));

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
