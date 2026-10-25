import { spawn } from "child_process";
import path from "path";
import process from "process";
import fs from "fs";

console.log(`
====================================================================
 🏛️  STARTING FIC CITY (MCD 311 CIVIC RESOLUTION SUITE)
====================================================================
 📱 Citizen & Officer Web App: http://localhost:3000
 🏛️ Municipal Admin Dashboard: http://localhost:3000
 🚀 Backend API & Sockets:     http://localhost:5000
 🤖 AI Chatbot Assistant:      Available on floating button & API
====================================================================
`);

const nodeExecutable = process.execPath;
const backendEntry = path.resolve("backend/src/server.js");
const viteEntry = path.resolve("frontend/node_modules/vite/bin/vite.js");

// 1. Spawn Backend server directly with Node (no shell / npm wrapper)
const backend = spawn(nodeExecutable, [backendEntry], {
  cwd: path.resolve("backend"),
  stdio: "inherit"
});

backend.on("error", (err) => {
  console.error("Failed to start backend:", err);
});

// 2. Spawn Vite frontend dev server directly with Node
const frontend = spawn(nodeExecutable, [viteEntry, "--port", "3000", "--host"], {
  cwd: path.resolve("frontend"),
  stdio: "inherit"
});

frontend.on("error", (err) => {
  console.error("Failed to start frontend:", err);
});

const cleanup = () => {
  console.log("\nShutting down Fic City servers...");
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
