const { parentPort } = require('node:worker_threads');

function normalizeTelemetry(input) {
  const items = Array.isArray(input) ? input : [input];
  return items.map((item) => {
    const latitude = Number(item.latitude ?? item.location?.latitude);
    const longitude = Number(item.longitude ?? item.location?.longitude);
    const speed = Number(item.speed ?? item.location?.speed ?? 0);
    const heading = Number(item.heading ?? item.location?.heading ?? 0);
    if (typeof item.fleetId !== 'string' || !item.fleetId.trim()) throw new Error('fleetId is required');
    if (typeof item.vehicleId !== 'string' || !item.vehicleId.trim()) throw new Error('vehicleId is required');
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error('latitude must be between -90 and 90');
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('longitude must be between -180 and 180');
    if (!Number.isFinite(speed) || speed < 0 || speed > 400) throw new Error('speed must be between 0 and 400');
    if (!Number.isFinite(heading) || heading < 0 || heading > 360) throw new Error('heading must be between 0 and 360');
    return {
      fleetId: item.fleetId.trim(), vehicleId: item.vehicleId.trim(),
      location: { latitude, longitude, speed, heading },
      recordedAt: item.recordedAt ? new Date(item.recordedAt) : new Date(),
    };
  });
}

parentPort.on('message', ({ id, payload }) => {
  try { parentPort.postMessage({ id, result: normalizeTelemetry(payload) }); }
  catch (error) { parentPort.postMessage({ id, error: error.message }); }
});
