# FleetDash Performance Validation Plan

Do not publish performance claims without a reproducible report.

## Test matrix

| Test | Suggested configuration | Capture |
|---|---|---|
| Smoke | 10 vehicles, 1 update/s | API correctness, UI connectivity |
| Functional | 250 vehicles, 1 update/s | accepted points, alerts, frontend errors |
| Rendering | 1,000 / 5,000 / 10,000 points | FPS, long tasks, memory, viewport draw time |
| Ingestion | 50, 100, 500, then 2,000 req/s | throughput, p95/p99, 4xx/5xx, CPU |
| Persistence | sustained ingestion for 5–10 min | submitted vs accepted vs persisted points, DB write latency |
| Distributed | 2 API instances + Redis | cross-instance event delivery, reconnect behavior |
| Geofence | known points inside/outside polygon | transition correctness, duplicate alert count |

## Result template

- Date/time and commit:
- Machine / CPU / RAM:
- Node version:
- MongoDB version and topology:
- Redis version/topology:
- Fleet size and batch size:
- Requests/s and points/s:
- p50 / p95 / p99 latency:
- HTTP error rate:
- Submitted / accepted / persisted points:
- MongoDB query/write latency:
- Median/minimum Canvas FPS:
- Peak browser memory:
- Known failures and follow-up actions:

## Interpreting targets

- `2,000 requests/s` and `2,000 points/s` are not equivalent when a request contains multiple points.
- `zero data omission` requires reconciling unique telemetry IDs or idempotency keys against durable storage; response counts alone are insufficient.
- `under 5 ms database queries` needs a measured query and a defined measurement boundary (application-level duration versus MongoDB execution time).
- `60 FPS` must be measured on the target browser/device and fleet density, not inferred from using Canvas.
