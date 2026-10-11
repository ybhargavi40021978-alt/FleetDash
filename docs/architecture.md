# FleetDash Architecture Notes

## Components

- `backend/src/controllers/telemetryController.js`: request validation flow, worker-pool invocation, geofence evaluation, persistence, event broadcast.
- `backend/src/realtime/workers/`: worker-thread validation and worker-pool dispatch.
- `backend/src/realtime/telemetry/bucketWriter.js`: hourly bucket writes.
- `backend/src/models/TelemetryBucket.js`: Mongoose telemetry bucket schema and indexes.
- `backend/src/realtime/services/geofenceService.js`: Turf.js point-in-polygon checks and state transitions.
- `backend/src/realtime/transport/redisPubSub.js`: optional Redis Pub/Sub distribution.
- `backend/src/realtime/socket/`: Socket.IO server and room event handlers.
- `frontend/src/components/CanvasFleetMap.jsx`: Canvas-based fleet drawing loop.
- `frontend/src/hooks/useVehicleLocations.js`: client-side telemetry subscription/state adapter.
- `backend/src/scripts/simulateFleet.js`: generated telemetry for local demonstrations.

## Reliability boundaries

The worker pool currently moves normalization/validation to worker threads, but it is not a durable queue. In-memory queue state is lost if the process exits. MongoDB writes are the persistence boundary. Redis Pub/Sub provides low-latency fan-out but not durable delivery. A client that disconnects can miss events unless it reconnects and fetches a fresh vehicle snapshot.

For stronger delivery guarantees, add idempotency keys, a bounded ingress queue, explicit retry/dead-letter behavior, persisted last-known vehicle state, replay/snapshot endpoints, and reconciliation metrics. For strict high-volume scale, profile MongoDB bucket document growth and consider native MongoDB time-series collections or a bucket-per-vehicle/time-window design.
