require("dotenv").config({ path: process.env.ENV_FILE || require("node:path").resolve(__dirname, "../../.env") });

const http = require("http");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");

const vehicleRoutes = require("./routes/vehicleRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const driverRoutes = require("./routes/driverRoutes");
const tripRoutes = require("./routes/tripRoutes");
const authRoutes = require("./routes/authRoutes");

const initializeSocket = require("./realtime/socket/socketServer");
const geofenceRoutes = require("./routes/geofenceRoutes");
const telemetryRoutes = require("./routes/telemetryRoutes");
const { initializeRedisPubSub, closeRedisPubSub } = require("./realtime/transport/redisPubSub");
const workerPool = require("./realtime/workers/telemetryWorkerPool");

const app = express();
const server = http.createServer(app);

const io = initializeSocket(server);
app.set("io", io);

// Startup is gated on MongoDB so the API never reports ready without durable storage.

// Middleware
app.use(cors({ origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","), credentials: true }));
app.use(express.json());

// Routes
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/geofences", geofenceRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "fleetdash-api", uptimeSeconds: Math.round(process.uptime()) }));

// Home Route
app.get("/", (req, res) => {
    res.send("FleetDash Backend Running Successfully");
});

// Start Server
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await initializeRedisPubSub(io);
    server.listen(PORT, () => console.log(`FleetDash API listening on port ${PORT}`));
  } catch (error) {
    console.error("FleetDash startup failed:", error.message);
    await workerPool.close();
    process.exit(1);
  }
}
start();

async function shutdown() {
  server.close();
  await closeRedisPubSub();
  await workerPool.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);