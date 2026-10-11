# Folder Guide

```text
FleetDash-main/
├── backend/
│   ├── src/config/          # MongoDB connection
│   ├── src/controllers/     # REST request handlers
│   ├── src/models/          # Mongoose schemas
│   ├── src/realtime/
│   │   ├── services/        # Geofence logic
│   │   ├── socket/          # Socket.IO server and event handlers
│   │   ├── telemetry/       # Hourly bucket writer
│   │   ├── transport/       # Redis Pub/Sub
│   │   └── workers/         # Worker thread pool and worker code
│   ├── src/routes/          # Express routes
│   ├── src/scripts/         # Synthetic fleet simulator
│   └── tests/               # Unit and k6 load-test scripts
├── frontend/
│   └── src/
│       ├── components/      # Canvas fleet map
│       ├── context/         # Auth and socket contexts
│       ├── hooks/           # Location hooks
│       ├── pages/           # Auth and dashboard screens
│       ├── socket/          # Socket client helpers
│       └── utils/            # Client utilities
├── docs/                    # Architecture, project report, validation plan
├── docker-compose.yml       # Local MongoDB and Redis services
└── README.md                # Setup and operating guide
```
