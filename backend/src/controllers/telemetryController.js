const workerPool = require('../realtime/workers/telemetryWorkerPool');
const { persistTelemetry } = require('../realtime/telemetry/bucketWriter');
const { checkGeofences } = require('../realtime/services/geofenceService');
const { updateVehicleLocation } = require('../services/vehicleService');
const { publishRealtimeEvent } = require('../realtime/transport/redisPubSub');

const ingestTelemetry = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    if (!items.length || items.length > 500) return res.status(400).json({ success: false, message: 'Batch must contain 1–500 telemetry points.' });
    const normalized = await workerPool.process(items);
    const acceptedByFleet = new Map();
    const alerts = [];
    for (const item of normalized) {
      const fenceEvents = checkGeofences(item.fleetId, item.vehicleId, item.location);
      const latestState = fenceEvents.length ? fenceEvents[fenceEvents.length - 1].event : null;
      await persistTelemetry(item, latestState === 'ENTERED' ? 'inside' : 'outside');
      const vehicle = updateVehicleLocation(item.fleetId, item.vehicleId, { ...item.location, recordedAt: item.recordedAt.toISOString() });
      if (!acceptedByFleet.has(item.fleetId)) acceptedByFleet.set(item.fleetId, []);
      acceptedByFleet.get(item.fleetId).push(vehicle);
      alerts.push(...fenceEvents);
    }
    const io = req.app.get('io');
    if (io) {
      for (const [fleetId, vehicles] of acceptedByFleet) await publishRealtimeEvent(io, fleetId, 'vehicle:location:batch', vehicles);
      for (const alert of alerts) await publishRealtimeEvent(io, alert.fleetId, 'geofence:alert', alert);
    }
    res.status(202).json({ success: true, received: items.length, accepted: normalized.length, alerts: alerts.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
module.exports = { ingestTelemetry };
