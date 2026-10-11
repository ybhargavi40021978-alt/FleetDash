# FleetDash — Project Report

## Abstract

FleetDash is an event-driven fleet telemetry dashboard designed to receive frequent vehicle-coordinate updates and display vehicle movement in a browser. The system separates coordinate validation from the primary Node.js event loop with worker threads, stores accepted telemetry in MongoDB hourly buckets, evaluates configurable geofences with Turf.js, and distributes updates to connected clients through Socket.IO. An optional Redis Pub/Sub layer supports event distribution across multiple backend instances. A Canvas renderer batches drawing work using `requestAnimationFrame` to reduce the cost of rendering frequent position changes.

## Problem statement

A fleet operations team may track thousands of vehicles, each producing frequent GPS updates. Processing every update synchronously and creating a DOM element for every point can increase event-loop delay, network overhead, memory use, and browser rendering cost. Operations staff also need prompt notifications when vehicles enter or leave restricted or operational areas.

## Objectives

1. Accept and validate high-frequency telemetry in batches.
2. Move payload normalization to worker threads.
3. Persist telemetry in time-grouped MongoDB documents with query indexes.
4. Distribute current locations to authorized fleet viewers in near real time.
5. Detect geofence transitions and publish alerts.
6. Render large point sets using Canvas and animation-frame batching.
7. Provide repeatable simulation and load testing so performance can be measured.

## Functional modules

### Authentication and dashboard
Users register or log in through the frontend. The dashboard presents fleet activity and a map-oriented view. Authentication alone is not sufficient for production security; authorization must also be enforced on every fleet and resource operation.

### Telemetry ingestion engine
The HTTP endpoint accepts a point or batch of up to 500 points. Worker threads validate required IDs, numeric ranges, and timestamps, then return normalized objects. Invalid payloads fail validation rather than entering the persistence pipeline.

### Storage layer
Telemetry is grouped by `fleetId` and the UTC hour of `recordedAt`. Each point includes vehicle ID, time, latitude, longitude, speed, heading, and geofence state. Indexes support fleet/hour and timestamp-oriented queries, and a TTL index can expire old data. Capacity and MongoDB document-size behavior must be tested at the target write rate.

### Geospatial rules
Each accepted point is checked against configured GeoJSON polygon boundaries. The service remembers the last observed inside/outside state and creates an alert when a vehicle changes state. GeoJSON uses longitude-first coordinate arrays. Multi-instance production deployment should use shared or persisted geofence state to avoid inconsistent transitions.

### Real-time event transport
Socket.IO fleet rooms carry batches of latest locations and individual geofence alerts. Redis Pub/Sub is optional for local work and useful for fan-out between backend instances. Pub/Sub is not a durable message log; reconnecting clients need a snapshot or replay strategy if they must recover missed events.

### Canvas rendering
The frontend receives location batches and updates a rendering buffer. The Canvas loop paints on animation frames, avoiding a React component render for every coordinate. Rendering performance depends on browser hardware, point density, viewport culling, and the amount of drawing work per frame.

## Non-functional requirements

- **Responsiveness:** avoid blocking the main Node.js event loop with CPU-heavy parsing.
- **Scalability:** batch ingestion and support distributed event fan-out.
- **Data integrity:** do not report a point as accepted before its database write succeeds.
- **Observability:** measure ingestion rate, request latency, error rate, worker queue depth, database latency, and frame rate.
- **Security:** protect credentials, validate payloads, authenticate sockets, authorize fleet membership, and use TLS in deployment.
- **Maintainability:** keep API controllers, models, workers, transport, frontend rendering, and test scripts separated.

## Test strategy

- Unit tests: valid/invalid coordinate normalization and geofence state transitions.
- API integration tests: authentication, malformed payloads, batch limits, persistence errors, and event publication.
- Load tests: increase request rate gradually and record p50/p95/p99 latency, error rate, CPU, and memory.
- Data integrity tests: reconcile submitted, accepted, and persisted telemetry using unique event IDs/idempotency keys.
- Frontend tests: check connection/reconnection, burst updates, viewport culling, and measured FPS at increasing fleet sizes.
- Distributed tests: run two API instances with Redis and verify that each authorized subscriber receives the correct fleet events.

## Expected outcome

The application should provide a responsive live fleet view, persist telemetry, and alert on geofence transitions. Quantitative goals such as 2,000 requests/second, zero missing records, sub-5 ms database queries, and 60 FPS are acceptance criteria, not assumed outcomes. They must be supported by a test report naming the hardware, database topology, payload size, fleet size, and measurement method.

## Current implementation boundary

The repository includes the main modules and a synthetic fleet simulator. The current frontend is JSX rather than strict TypeScript, the worker pool is in-memory rather than durable, and complete integration/performance testing requires running MongoDB and optionally Redis. Production deployment also needs consistent authorization, backpressure, metrics, retry handling, and recorded benchmark evidence.
