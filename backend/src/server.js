import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { Server } from "socket.io";
import apiRouter from "./routes/api.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Static uploads directory
const uploadPath = path.resolve("uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
app.use("/uploads", express.static(uploadPath));

// API Routes
app.use("/api", apiRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Fic City Municipal API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Also serve the built frontend if available (so http://localhost:5000 works as a standalone single-port app)
const distPath = path.resolve("../frontend/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/socket.io")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Socket.io Connection Handler
io.on("connection", (socket) => {
  console.log(`🔌 Client connected to real-time events: ${socket.id}`);

  socket.on("join:ward", (wardId) => {
    socket.join(`ward:${wardId}`);
    console.log(`Socket ${socket.id} joined ward:${wardId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ==============================================================
   🏛️  FIC CITY CIVIC COMPLAINT RESOLUTION SYSTEM (BACKEND)
  ==============================================================
   🚀 API Server running on: http://localhost:${PORT}
   📡 Socket.IO Real-time:    http://localhost:${PORT}
   📂 Uploads directory:      ${uploadPath}
   📋 Health Check:           http://localhost:${PORT}/health
   🎯 Base API:               http://localhost:${PORT}/api/complaints
  ==============================================================
  `);
});
