/**
 * Optional local telemetry simulator for demos and integration checks.
 * This is generated test traffic, not live GPS data. It writes through the same
 * HTTP ingestion endpoint used by external vehicle gateways.
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const FLEET_ID = process.env.FLEET_ID || 'fleet-001';
const VEHICLES = Math.max(1, Math.min(10000, Number(process.env.VEHICLES || 250)));
const BATCH_SIZE = Math.max(1, Math.min(500, Number(process.env.BATCH_SIZE || 100)));
const INTERVAL_MS = Math.max(100, Number(process.env.INTERVAL_MS || 1000));
const CENTER = { latitude: Number(process.env.CENTER_LAT || 12.9716), longitude: Number(process.env.CENTER_LON || 77.5946) };
const state = new Map();
for (let i = 0; i < VEHICLES; i += 1) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 0.005 + Math.random() * 0.035;
  state.set(`truck-${String(i + 1).padStart(5, '0')}`, {
    latitude: CENTER.latitude + Math.sin(angle) * radius,
    longitude: CENTER.longitude + Math.cos(angle) * radius,
    heading: Math.random() * 360,
    speed: 15 + Math.random() * 55,
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function sendBatch(batch) {
  const response = await fetch(`${BASE_URL}/api/telemetry/batch`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(batch),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Ingestion returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  console.log(`FleetDash telemetry simulator | ${VEHICLES} vehicles | ${FLEET_ID} | ${BASE_URL}`);
  console.log('Generated coordinates are simulated. Press Ctrl+C to stop.');
  let tick = 0;
  while (true) {
    const recordedAt = new Date().toISOString();
    const all = [];
    for (const [vehicleId, point] of state) {
      // Small movement per tick; heading and speed change gradually.
      point.heading = (point.heading + (Math.random() - 0.5) * 14 + 360) % 360;
      point.speed = Math.max(0, Math.min(95, point.speed + (Math.random() - 0.5) * 8));
      const radians = point.heading * Math.PI / 180;
      point.latitude += Math.cos(radians) * point.speed * 0.0000008;
      point.longitude += Math.sin(radians) * point.speed * 0.0000008;
      all.push({ fleetId: FLEET_ID, vehicleId, latitude: point.latitude, longitude: point.longitude, speed: Number(point.speed.toFixed(1)), heading: Number(point.heading.toFixed(1)), recordedAt });
    }
    let accepted = 0;
    for (let i = 0; i < all.length; i += BATCH_SIZE) {
      const result = await sendBatch(all.slice(i, i + BATCH_SIZE));
      accepted += result.accepted || 0;
    }
    tick += 1;
    console.log(`[tick ${tick}] submitted=${all.length} accepted=${accepted}`);
    await sleep(INTERVAL_MS);
  }
}
main().catch((error) => { console.error(`Simulator stopped: ${error.message}`); process.exitCode = 1; });
