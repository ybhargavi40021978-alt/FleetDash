# FleetDash — High-Throughput Event-Driven Fleet Telemetry Dashboard

FleetDash is a full-stack fleet monitoring project built to demonstrate how a logistics operations team can ingest vehicle coordinates, persist telemetry, distribute live updates, evaluate geofences, and render a large number of moving vehicles without forcing React to re-render on every coordinate update.

> **Scope and performance honesty:** this repository contains a working application baseline, a generated-telemetry simulator, unit-test scaffolding, and a k6 load-test scenario. It does not by itself prove 2,000 requests/second, zero data loss, sub-5 ms database queries, or sustained 60 FPS. Those are acceptance targets that must be measured on the target machine and database topology. Simulator traffic is synthetic and must not be described as live GPS data.

## 1. Feature overview

- **Operations dashboard:** fleet overview, vehicle status and current location view.
- **Authentication:** registration/login flow backed by the API. Configure a strong `JWT_SECRET` before use.
- **Telemetry ingestion:** `POST /api/telemetry/batch`, accepting a single point or an array of up to 500 points.
- **Worker-thread validation:** parses and normalizes coordinates outside the primary Node.js event loop.
- **MongoDB hourly bucket storage:** groups points by fleet and UTC hour, with indexed lookup and configurable retention.
- **Real-time distribution:** Socket.IO rooms and optional Redis Pub/Sub for multi-process fan-out.
- **Geofence alerts:** Turf.js point-in-polygon checks emit transition events (`ENTERED` and `EXITED`).
- **Canvas rendering:** high-frequency positions are rendered with Canvas and `requestAnimationFrame` rather than putting each point into React state.
- **Synthetic fleet simulator:** creates repeatable demo traffic for up to 10,000 simulated vehicles; use it to validate the data path locally.
- **Load-test scaffold:** k6 script for controlled API ingestion testing.

## 2. Architecture and data flow

```text
Vehicle GPS / Simulator / Load Generator
                 |
                 v
      Express POST /api/telemetry/batch
                 |
                 v
        Worker Thread Pool
     (validation + normalization)
                 |
                 v
     Turf.js geofence evaluation
                 |
        +--------+---------+
        |                  |
        v                  v
 MongoDB hourly       Redis Pub/Sub (optional)
 telemetry buckets          |
        |                   v
        +------------> Socket.IO fleet rooms
                            |
                            v
                 React socket event handler
                            |
                            v
                in-memory point buffer / Canvas
                  requestAnimationFrame loop
```

### Key design decisions

1. **Batch before broadcast:** the ingestion endpoint accepts up to 500 telemetry points in one request. Tune batch size based on device/network behavior.
2. **Keep React state low-frequency:** telemetry points are held in a mutable rendering buffer; the Canvas loop paints the latest snapshot on animation frames.
3. **Persist before acknowledging:** accepted points are written to MongoDB before the API returns HTTP `202`. If persistence fails, the API returns an error instead of reporting success.
4. **Optional Redis:** a single backend can operate without Redis. Multi-instance deployment needs Redis fan-out and shared, durable data services.
5. **Geofence coordinate order:** GeoJSON coordinates are `[longitude, latitude]`, while telemetry payload fields are named `latitude` and `longitude`.
6. **Bucket limits:** buckets have a bounded point count. Monitor bucket capacity and document size under high-volume traffic; production workloads may require sharded/time-series collections or smaller per-vehicle buckets.

## 3. Technology stack

| Layer | Technologies | Responsibility |
|---|---|---|
| Frontend | React 18, Vite, JavaScript, CSS, Canvas API | Dashboard, controls, live rendering |
| Map | React-Leaflet / Leaflet and Canvas overlay | Geographic context and vehicle visualization |
| API | Node.js, Express | Auth, REST endpoints, telemetry ingestion |
| Parallel processing | `worker_threads` | Payload validation and normalization |
| Database | MongoDB, Mongoose | Users, vehicles, drivers, trips, telemetry buckets |
| Real-time | Socket.IO | Fleet room membership and live events |
| Broker | Redis / ioredis | Cross-instance event distribution (optional) |
| Geospatial | Turf.js | Polygon containment and geofence transitions |
| Testing | Jest, Supertest, k6 | Unit/API and load-test scaffolding |

The existing UI source is JavaScript/JSX rather than strict TypeScript. If strict typing is an evaluation requirement, the frontend still needs a TypeScript migration (`.tsx`, typed event payloads, and a strict `tsconfig`).

## 4. Requirements

- Node.js 20 or newer (Node 22 recommended)
- npm
- MongoDB 6+ local instance or MongoDB Atlas URI
- Redis 6+ optional for distributed Pub/Sub
- k6 optional for load tests

## 5. Local setup

### A. Configure environment

Copy the root `.env.example` to `.env` and set at least:

```dotenv
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/fleetdash
JWT_SECRET=replace-with-a-long-random-secret
REDIS_ENABLED=false
TELEMETRY_TTL_SECONDS=2592000
```

Generate a private secret rather than keeping the example value. Never commit `.env` or production secrets. `frontend/.env.example` documents `VITE_API_URL` and `VITE_SOCKET_URL`.

### B. Start MongoDB

Start your local MongoDB service or create an Atlas database and use its connection string. The API waits for MongoDB before it begins listening.

### C. Install and start backend

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

### D. Install and start frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, register an account, and open the dashboard. The browser must be able to reach the API and Socket.IO server URLs configured in `frontend/.env` if they differ from local defaults.

## 6. Run a live dashboard demonstration

After the backend and frontend are running, start a third terminal:

```bash
cd backend
VEHICLES=250 BATCH_SIZE=100 INTERVAL_MS=1000 npm run simulate
```

The simulator sends generated points through the actual HTTP ingestion endpoint. Increase the fleet gradually (for example, 250, 1,000, then 5,000 vehicles) and watch browser CPU, frame rate, API latency, and database write throughput. Stop it with `Ctrl+C`.

Configurable simulator variables:

| Variable | Default | Meaning |
|---|---:|---|
| `BASE_URL` | `http://localhost:5000` | API base URL |
| `FLEET_ID` | `fleet-lab` | Fleet room / telemetry partition |
| `VEHICLES` | `250` | Simulated vehicle count (maximum 10,000) |
| `BATCH_SIZE` | `100` | Points sent per request (maximum 500) |
| `INTERVAL_MS` | `1000` | Delay between complete fleet updates |
| `CENTER_LAT` | `12.9716` | Starting latitude |
| `CENTER_LON` | `77.5946` | Starting longitude |

## 7. API reference

### Health

`GET /api/health`

Returns service status and uptime. It is a basic liveness endpoint, not a complete readiness check for every dependency.

### Telemetry ingestion

`POST /api/telemetry/batch`

Request body can be one object or an array containing up to 500 objects:

```json
{
  "fleetId": "fleet-lab",
  "vehicleId": "truck-00001",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 42,
  "heading": 90,
  "recordedAt": "2026-10-11T04:30:00.000Z"
}
```

Fields: `fleetId` and `vehicleId` are required strings; latitude must be -90..90; longitude -180..180; speed 0..400; heading 0..360. `recordedAt` is optional and defaults to server time. A successful response returns HTTP `202` with `received`, `accepted`, and `alerts` counts. Invalid batches return an error response.

### Other routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `/api/vehicles`
- `/api/drivers`
- `/api/trips`
- `GET /api/geofences`

For exact request/response schemas, inspect each route and controller under `backend/src`. The routes should be treated as a college-project baseline until authorization and validation are applied consistently to every resource.

## 8. Real-time event contract

The frontend connects to Socket.IO. The current event flow includes:

- `join:fleet` — asks the server to subscribe a socket to a fleet room.
- `vehicle:location:batch` — array of latest vehicle locations for a fleet.
- `geofence:alert` — geofence transition containing fleet, vehicle, geofence, event type, timestamp, and location.

**Security note:** production deployment must validate the user's token and verify that the user is allowed to join the requested fleet room. Never trust a client-provided `fleetId` by itself as authorization.

## 9. Geofence configuration

The default geofence is a sample 5 km area around Bengaluru. Configure polygons using `GEOFENCES_JSON` in the backend environment. Each entry should include an `id`, optional `name`, and a GeoJSON Polygon geometry. Coordinates must be `[longitude, latitude]`.

Example shape (replace coordinates with your actual boundary):

```json
[
  {
    "id": "warehouse-zone",
    "name": "Warehouse Zone",
    "polygon": {
      "type": "Polygon",
      "coordinates": [[[77.58,12.96],[77.61,12.96],[77.61,12.99],[77.58,12.99],[77.58,12.96]]]
    }
  }
]
```

A transition is emitted only after the service has observed a previous state and then detects a change. On a fresh process, the first point establishes the initial state and may not create an alert.

## 10. Redis Pub/Sub

For local single-process development, leave `REDIS_ENABLED=false`. To test distributed event fan-out, start Redis and configure `REDIS_ENABLED=true` and the appropriate host/port or `REDIS_URL`. All API instances must use the same Redis deployment/channel. Redis Pub/Sub is not a durable queue: it does not replay messages to disconnected subscribers. Use a durable stream/queue and retry policy if every event must survive outages.

## 11. Tests and load validation

### Unit tests

```bash
cd backend
npm install
npm test
```

### k6 load test

Install k6 separately, start MongoDB and the backend, then run a small test first:

```bash
cd backend
RATE=50 DURATION=30s k6 run tests/load/telemetry.js
```

Only after the low-rate run succeeds should you try the target scenario:

```bash
RATE=2000 DURATION=30s k6 run tests/load/telemetry.js
```

Set `BASE_URL` when targeting a non-local server. The current k6 script submits one point per HTTP request, so 2,000 requests/s is different from 2,000 points/s in batched requests. Record p50/p95/p99 latency, errors, CPU, memory, MongoDB write latency, persisted document/point counts, and browser FPS. Verify accepted versus persisted point counts independently before claiming zero loss.

### Acceptance checklist

- [ ] Registration/login works against the configured MongoDB instance.
- [ ] No sample credentials are required to access the dashboard.
- [ ] API rejects invalid coordinates and batches larger than 500.
- [ ] Every successful response's accepted points can be reconciled with database writes.
- [ ] Repeated vehicle updates reach the correct fleet room.
- [ ] Geofence entry and exit events are emitted once per state transition.
- [ ] Redis fan-out works with two backend instances when enabled.
- [ ] 1k, 5k, and target fleet-size Canvas tests record stable FPS and memory.
- [ ] k6 target load passes with documented environment and measured results.
- [ ] Fleet-room membership and resource APIs enforce authorization.

## 12. Known limitations and production hardening

This is an educational foundation, not a certified production fleet platform. Before production use:

- Add rate limiting, request-size limits, schema validation, and structured request IDs.
- Add JWT verification and fleet/resource authorization to REST and Socket.IO paths.
- Use bounded worker queues/backpressure; a queue with no limit can exhaust memory during overload.
- Review geofence state persistence and multi-instance consistency.
- Consider MongoDB time-series collections or per-vehicle buckets for high-volume telemetry; validate document size and bucket-cap behavior.
- Add metrics for queue depth, worker utilization, ingest rate, rejected points, database latency, socket fan-out, and dropped frames.
- Configure HTTPS, secret management, backups, alerting, and deployment health/readiness checks.
- Run a TypeScript migration if the strict-typed React requirement is mandatory.

## 13. Week-wise project plan mapping

| Week | Required outcome | Project evidence / remaining verification |
|---|---|---|
| 1 | Express, worker pool, Mongo bucket schema, React scaffold, k6 setup | Worker, bucket model, API and load script exist; benchmark and schema/index behavior under load |
| 2 | Redis Pub/Sub and high-frequency Socket.IO transport | Redis publisher/subscriber code exists; verify with Redis running and multiple backend instances; binary ArrayBuffer transport is not yet guaranteed by the JSON event path |
| Mid-review | 2,000 req/s, zero omission, indexed queries under 5 ms | Run k6 and DB reconciliation; report actual results rather than assumed results |
| 3 | Turf.js boundary checks and Canvas rendering | Geofence service and Canvas renderer exist; test entry/exit boundaries and FPS at fleet scale |
| 4 | CI/CD, Jest/Supertest, deployment and polish | Unit/load scaffolding exists; add API integration tests, CI workflow, production environment config and recorded performance report |

## 14. Suggested project presentation

1. Explain the problem: high-frequency GPS updates can overwhelm the main thread and DOM.
2. Show the architecture and data path from ingestion to workers, MongoDB, Redis, Socket.IO, and Canvas.
3. Start the app and the simulator, showing generated vehicles moving.
4. Demonstrate a geofence transition and alert.
5. Run the load test at a safe rate and show real metrics.
6. Present measured limitations and the next production-hardening steps honestly.
