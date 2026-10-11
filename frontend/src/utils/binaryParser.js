const MAGIC_HEADER = 0xfd;
const RECORD_SIZE = 36;

/**
 * Parses binary ArrayBuffer received over Socket.io into JavaScript objects
 */
export function parseBinaryTelemetry(buffer) {
  if (!buffer || buffer.byteLength < RECORD_SIZE) {
    return null;
  }

  const view = new DataView(buffer);
  const header = view.getUint8(0);

  if (header !== MAGIC_HEADER) {
    return null;
  }

  const timestamp = view.getFloat64(1, true);
  const latitude = view.getFloat64(9, true);
  const longitude = view.getFloat64(17, true);
  const speed = Math.round(view.getFloat32(25, true) * 10) / 10;
  const heading = Math.round(view.getFloat32(29, true) * 10) / 10;
  const isBreached = view.getUint8(33) === 1;
  const vehIdCode = view.getUint16(34, true);

  return {
    vehicleId: `VH-${String(vehIdCode).padStart(3, "0")}`,
    fleetId: "fleet-001",
    location: {
      latitude,
      longitude,
      speed,
      heading,
    },
    isBreached,
    updatedAt: new Date(timestamp).toISOString(),
  };
}

export function parseBinaryTelemetryBatch(buffer) {
  if (!buffer) return [];
  const count = Math.floor(buffer.byteLength / RECORD_SIZE);
  const results = [];

  for (let i = 0; i < count; i++) {
    const slice = buffer.slice(i * RECORD_SIZE, (i + 1) * RECORD_SIZE);
    const parsed = parseBinaryTelemetry(slice);
    if (parsed) results.push(parsed);
  }

  return results;
}
