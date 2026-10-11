const workerPool = require('../workers/telemetryWorkerPool');
const { persistTelemetry } = require('../telemetry/bucketWriter');
const { checkGeofences } = require('../services/geofenceService');
const { updateVehicleLocation } = require('../../services/vehicleService');
const { publishRealtimeEvent } = require('../transport/redisPubSub');

const MAX_BATCH_SIZE = 500;

module.exports = (io, socket) => {
  socket.on('join:fleet', (fleetId, acknowledge) => {
    if (typeof fleetId !== 'string' || !fleetId.trim()) {
      if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'A valid fleetId is required.' });
      return;
    }
    socket.join(fleetId.trim());
    if (typeof acknowledge === 'function') acknowledge({ ok: true, fleetId: fleetId.trim() });
    socket.emit('joined:fleet', fleetId.trim());
  });

  socket.on('telemetry:batch', async (payload, acknowledge) => {
    try {
      const items = Array.isArray(payload) ? payload : [payload];
      if (!items.length || items.length > MAX_BATCH_SIZE) throw new Error(`Batch size must be between 1 and ${MAX_BATCH_SIZE}`);
      const normalized = await workerPool.process(items);
      const accepted = [];
      const alerts = [];
      for (const item of normalized) {
        const fenceEvents = checkGeofences(item.fleetId, item.vehicleId, item.location);
        const state = fenceEvents.length && fenceEvents[fenceEvents.length - 1].event === 'ENTERED' ? 'inside' : 'outside';
        await persistTelemetry(item, state);
        const vehicle = updateVehicleLocation(item.fleetId, item.vehicleId, {
          ...item.location, recordedAt: item.recordedAt.toISOString(),
        });
        accepted.push(vehicle);
        alerts.push(...fenceEvents);
      }
      // One message per accepted batch avoids thousands of small socket frames.
      const roomIds = [...new Set(accepted.map((v) => v.fleetId))];
      for (const fleetId of roomIds) {
        const batch = accepted.filter((v) => v.fleetId === fleetId);
        await publishRealtimeEvent(io, fleetId, 'vehicle:location:batch', batch);
      }
      for (const alert of alerts) await publishRealtimeEvent(io, alert.fleetId, 'geofence:alert', alert);
      if (typeof acknowledge === 'function') acknowledge({ ok: true, received: items.length, accepted: accepted.length, alerts: alerts.length });
    } catch (error) {
      if (typeof acknowledge === 'function') acknowledge({ ok: false, error: error.message });
      else socket.emit('telemetry:error', { message: error.message });
    }
  });

  // Backward-compatible single-point event used by the current UI.
  socket.on('vehicle:location', async (payload, acknowledge) => {
    socket.emit('telemetry:legacy-warning', { message: 'Use telemetry:batch for efficient ingestion.' });
    socket.emit('telemetry:legacy-rejected', { message: 'Send validated points with telemetry:batch.' });
    if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Use telemetry:batch.' });
  });
};
