import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import CanvasFleetMap from "../../components/CanvasFleetMap";
import { parseBinaryTelemetryBatch, parseBinaryTelemetry } from "../../utils/binaryParser";
import {
  Activity,
  Wifi,
  WifiOff,
  Zap,
  ShieldAlert,
  Gauge,
  Play,
  Square,
  Database,
  Cpu,
  Layers,
  Search,
  Filter,
  LogOut,
  User,
} from "lucide-react";

export default function Dashboard() {
  const { socket, isConnected } = useSocket();
  const { user, logout, setShowAuthModal } = useAuth();

  // Decoupled vehicle reference map to bypass React state re-render bottlenecks
  const vehiclesRef = useRef(new Map());

  // UI state for periodic stats display
  const [fps, setFps] = useState(60);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [throughput, setThroughput] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [geofences, setGeofences] = useState([
    {
      id: "hub-bangalore-central",
      name: "Central Logistics Hub",
      center: [12.9716, 77.5946],
      radiusMeters: 5000,
    },
    {
      id: "hub-airport-cargo",
      name: "Airport Freight Terminal",
      center: [13.1986, 77.7066],
      radiusMeters: 3000,
    },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbLatency] = useState("API metric unavailable");

  const eventCounterRef = useRef(0);
  const simIntervalRef = useRef(null);

  // Sync vehicle map count periodically (every 500ms) without triggering 60 FPS state re-renders
  useEffect(() => {
    const timer = setInterval(() => {
      setVehicleCount(vehiclesRef.current.size);

      // Measure throughput per second
      setThroughput(eventCounterRef.current * 2);
      eventCounterRef.current = 0;
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Fetch backend active geofences
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/geofences`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.geofences) setGeofences(data.geofences);
      })
      .catch(() => {});
  }, []);

  // Socket.io stream subscription
  useEffect(() => {
    if (!socket) return;

    // Join default fleet room
    socket.emit("join:fleet", "fleet-001");

    // Standard JSON Location listener
    const handleLocation = (vehicle) => {
      if (!vehicle || !vehicle.vehicleId) return;
      eventCounterRef.current++;
      vehiclesRef.current.set(vehicle.vehicleId, {
        ...vehicle,
        location: vehicle.location || {},
        updatedAt: vehicle.updatedAt || vehicle.recordedAt || new Date().toISOString(),
      });
      setEvents((prev) => [vehicle, ...prev.slice(0, 19)]);
    };
    const handleLocationBatch = (batch) => {
      if (!Array.isArray(batch)) return;
      eventCounterRef.current += batch.length;
      for (const vehicle of batch) {
        if (!vehicle?.vehicleId) continue;
        vehiclesRef.current.set(vehicle.vehicleId, {
          ...vehicle, updatedAt: vehicle.updatedAt || vehicle.recordedAt || new Date().toISOString(),
        });
      }
      if (batch.length) setEvents((prev) => [...batch.slice(-20).reverse(), ...prev].slice(0, 20));
    };

    // Low-Latency Binary ArrayBuffer Listener
    const handleBinaryLocation = (binaryBuffer) => {
      eventCounterRef.current++;
      const items = parseBinaryTelemetryBatch(binaryBuffer);

      if (items.length > 0) {
        items.forEach((v) => vehiclesRef.current.set(v.vehicleId, v));
      } else {
        const single = parseBinaryTelemetry(binaryBuffer);
        if (single) vehiclesRef.current.set(single.vehicleId, single);
      }
    };

    // Geofence Breach Alert Listener
    const handleAlert = (alertData) => {
      setAlerts((prev) => [alertData, ...prev.slice(0, 29)]);
      if (alertData.vehicleId && vehiclesRef.current.has(alertData.vehicleId)) {
        const v = vehiclesRef.current.get(alertData.vehicleId);
        v.isBreached = alertData.event !== "ENTERED";
      }
    };

    socket.on("vehicle:location", handleLocation);
    socket.on("vehicle:location:batch", handleLocationBatch);
    socket.on("vehicle:location:binary", handleBinaryLocation);
    socket.on("geofence:alert", handleAlert);

    return () => {
      socket.off("vehicle:location", handleLocation);
      socket.off("vehicle:location:batch", handleLocationBatch);
      socket.off("vehicle:location:binary", handleBinaryLocation);
      socket.off("geofence:alert", handleAlert);
    };
  }, [socket]);

  // Client-side high-throughput simulator (generates 2,000+ moving vehicles)
  const toggleSimulator = () => {
    if (isSimulating) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);
    // Initialize 2,000 vehicle points around Bangalore region
    const VEHICLE_TOTAL = 2000;
    const centerLat = 12.9716;
    const centerLng = 77.5946;

    for (let i = 1; i <= VEHICLE_TOTAL; i++) {
      const vId = `VH-${String(i).padStart(4, "0")}`;
      const lat = centerLat + (Math.random() - 0.5) * 0.15;
      const lng = centerLng + (Math.random() - 0.5) * 0.15;
      const speed = Math.floor(20 + Math.random() * 75);
      const heading = Math.floor(Math.random() * 360);

      vehiclesRef.current.set(vId, {
        vehicleId: vId,
        fleetId: "fleet-001",
        location: { latitude: lat, longitude: lng, speed, heading },
        updatedAt: new Date().toISOString(),
      });
    }

    // High frequency position updates loop (50ms interval)
    simIntervalRef.current = setInterval(() => {
      vehiclesRef.current.forEach((v) => {
        // Move coordinates slightly
        const deltaLat = (Math.random() - 0.5) * 0.0008;
        const deltaLng = (Math.random() - 0.5) * 0.0008;

        v.location.latitude += deltaLat;
        v.location.longitude += deltaLng;
        v.location.speed = Math.min(110, Math.max(10, v.location.speed + (Math.random() - 0.5) * 6));
        v.updatedAt = new Date().toISOString();

        eventCounterRef.current++;
      });
    }, 50);
  };


  useEffect(() => () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
  }, []);

  const handleFpsUpdate = useCallback((newFps) => {
    setFps(newFps);
  }, []);

  const handleSelectVehicle = (veh) => {
    setSelectedVehicle(veh);
  };

  const breachedCount = alerts.filter((a) => a.event === "ENTERED").length;

  return (
    <div className="dashboard-container">
      {/* Top Header Navbar */}
      <header className="dashboard-header glass">
        <div className="brand-group">
          <div className="brand-icon">
            <Zap className="icon-bolt" />
          </div>
          <div>
            <h1 className="brand-title">FleetDash Engine</h1>
            <p className="brand-subtitle">High-Throughput Telemetry Platform (Worker Threads + Canvas API)</p>
          </div>
        </div>

        <div className="status-group">
          {/* FPS Badge */}
          <div className={`metric-badge ${fps >= 55 ? "badge-success" : "badge-warning"}`}>
            <Activity size={16} />
            <span>{fps} FPS</span>
          </div>

          {/* Ingestion Speed */}
          <div className="metric-badge badge-info">
            <Gauge size={16} />
            <span>{throughput.toLocaleString()} updates/sec</span>
          </div>

          {/* Database Query Speed */}
          <div className="metric-badge badge-purple">
            <Database size={16} />
            <span>DB latency: {dbLatency}</span>
          </div>

          {/* Connection Status */}
          <div className={`metric-badge ${isConnected ? "badge-success" : "badge-danger"}`}>
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isConnected ? "Socket Binary Stream" : "Disconnected"}</span>
          </div>

          {/* Load Simulator Button */}
          <button
            className={`btn-sim ${isSimulating ? "btn-danger" : "btn-primary"}`}
            onClick={toggleSimulator}
          >
            {isSimulating ? <Square size={16} /> : <Play size={16} />}
            <span>{isSimulating ? "Stop Load Test" : "Local Canvas Stress Test"}</span>
          </button>

          {/* User Profile & Sign In / Logout */}
          <div className="user-profile-badge">
            <div className="avatar-circle">
              <User size={16} />
            </div>
            <div className="user-info font-mono">
              <span className="user-name">{user?.name || "Fleet Observer"}</span>
              <span className="user-role">{user?.isGuest ? "Guest Access" : user?.role || "Manager"}</span>
            </div>
            {user?.isGuest ? (
              <button
                className="btn-signin-nav"
                onClick={() => setShowAuthModal(true)}
                title="Sign In or Register Account"
              >
                Sign In
              </button>
            ) : (
              <button className="btn-logout" onClick={logout} title="Sign Out">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="dashboard-grid">
        {/* Left Column: Live Canvas Map */}
        <section className="map-section glass">
          <div className="map-header">
            <div className="map-title-group">
              <Layers size={18} />
              <span className="section-title">Live Canvas Spatial Viewport</span>
              <span className="badge-live">requestAnimationFrame</span>
            </div>
            <div className="map-stats font-mono">
              Rendering <strong>{vehicleCount.toLocaleString()}</strong> local/live points · measured {fps} FPS
            </div>
          </div>

          <div className="map-wrapper">
            <CanvasFleetMap
              vehiclesRef={vehiclesRef}
              geofences={geofences}
              onFpsUpdate={handleFpsUpdate}
              onSelectVehicle={handleSelectVehicle}
            />
          </div>
        </section>

        {/* Right Column: Metrics & Terminal Alerts */}
        <aside className="sidebar-section">
          {/* Key Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card glass">
              <div className="card-header">
                <Cpu size={18} className="text-blue" />
                <span className="card-label">Active Vehicles</span>
              </div>
              <div className="card-value">{vehicleCount.toLocaleString()}</div>
              <div className="card-foot">MongoDB Bucket Pattern</div>
            </div>

            <div className="metric-card glass">
              <div className="card-header">
                <ShieldAlert size={18} className="text-red" />
                <span className="card-label">Geofence Breaches</span>
              </div>
              <div className="card-value text-red">{breachedCount}</div>
              <div className="card-foot">Turf.js Intersection Engine</div>
            </div>
          </div>

          {/* Selected Vehicle Info Card */}
          {selectedVehicle && (
            <div className="vehicle-card glass">
              <div className="card-title">Vehicle Telemetry Detail</div>
              <div className="info-grid">
                <div>
                  <span className="label">ID:</span> <strong>{selectedVehicle.vehicleId}</strong>
                </div>
                <div>
                  <span className="label">Speed:</span> <strong>{selectedVehicle.location?.speed} km/h</strong>
                </div>
                <div>
                  <span className="label">Lat:</span> {selectedVehicle.location?.latitude?.toFixed(4)}
                </div>
                <div>
                  <span className="label">Lng:</span> {selectedVehicle.location?.longitude?.toFixed(4)}
                </div>
              </div>
            </div>
          )}

          {/* Geofence Breach Terminal */}
          <div className="terminal-panel glass">
            <div className="terminal-header">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
              <span className="terminal-title">Realtime Geofence Breach Alerts (Turf.js)</span>
            </div>
            <div className="terminal-body font-mono">
              {!alerts.length ? (
                <div className="terminal-line timestamp">
                  🟢 Monitoring boundary intersections... No breaches detected.
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div
                    key={`${alert.vehicleId}-${alert.occurredAt}-${idx}`}
                    className={`terminal-line ${alert.event === "ENTERED" ? "success" : "danger"}`}
                  >
                    [{new Date(alert.occurredAt || Date.now()).toLocaleTimeString()}] {alert.vehicleId}{" "}
                    {alert.event === "ENTERED" ? "🟢 ENTERED" : "🚨 BREACHED"}{" "}
                    {alert.geofenceName || alert.geofenceId}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Ingestion Event Stream */}
          <div className="terminal-panel glass">
            <div className="terminal-header">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
              <span className="terminal-title">Binary Transport Stream (ArrayBuffer / Worker Pool)</span>
            </div>
            <div className="terminal-body font-mono">
              {!events.length ? (
                <div className="terminal-line timestamp">Waiting for stream events...</div>
              ) : (
                events.slice(0, 10).map((ev, idx) => (
                  <div key={`${ev.vehicleId}-${idx}`} className="terminal-line success">
                    [{new Date(ev.updatedAt || Date.now()).toLocaleTimeString()}] {ev.vehicleId}: Lat{" "}
                    {ev.location?.latitude?.toFixed(4)}, Lng {ev.location?.longitude?.toFixed(4)} |{" "}
                    {ev.location?.speed} km/h
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}