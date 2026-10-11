const turf = require('@turf/turf');

// Geofences can be configured with GEOFENCES_JSON. Coordinates use [longitude, latitude].
const defaultGeofences = [{
  id: 'bangalore-hub', name: 'Bengaluru Logistics Hub',
  center: [12.9716, 77.5946], radiusMeters: 5000,
  polygon: turf.circle([77.5946, 12.9716], 5, { steps: 48, units: 'kilometers' }).geometry,
}];
let geofences = defaultGeofences;
try {
  if (process.env.GEOFENCES_JSON) {
    const configured = JSON.parse(process.env.GEOFENCES_JSON);
    if (Array.isArray(configured) && configured.length) geofences = configured.map((f) => ({
      id: f.id, name: f.name || f.id, center: f.center, radiusMeters: f.radiusMeters,
      polygon: f.polygon?.type === 'Feature' ? f.polygon.geometry : f.polygon,
    }));
  }
} catch (error) { console.error('Invalid GEOFENCES_JSON; using default geofence:', error.message); }

const states = new Map();
function checkGeofences(fleetId, vehicleId, location) {
  const point = turf.point([location.longitude, location.latitude]);
  const key = `${fleetId}:${vehicleId}`;
  const previous = states.get(key) || new Map();
  const events = [];
  for (const fence of geofences) {
    if (!fence.polygon) continue;
    const inside = turf.booleanPointInPolygon(point, turf.feature(fence.polygon));
    const prior = previous.get(fence.id);
    if (prior !== undefined && prior !== inside) events.push({
      fleetId, vehicleId, geofenceId: fence.id, geofenceName: fence.name,
      event: inside ? 'ENTERED' : 'EXITED', occurredAt: new Date().toISOString(),
      location: { ...location },
    });
    previous.set(fence.id, inside);
  }
  states.set(key, previous);
  return events;
}
function listGeofences() {
  return geofences.map(({ id, name, center, radiusMeters, polygon }) => ({ id, name, center, radiusMeters, polygon }));
}
module.exports = { checkGeofences, listGeofences };
