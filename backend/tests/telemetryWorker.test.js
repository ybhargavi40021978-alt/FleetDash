const workerPool = require('../src/realtime/workers/telemetryWorkerPool');

afterAll(async () => { await workerPool.close(); });

test('normalizes valid telemetry and preserves its vehicle identity', async () => {
  const [point] = await workerPool.process({ fleetId: 'fleet-a', vehicleId: 'truck-1', latitude: 13.08, longitude: 80.27, speed: 45, heading: 90 });
  expect(point.vehicleId).toBe('truck-1');
  expect(point.location.latitude).toBe(13.08);
  expect(point.recordedAt).toBeInstanceOf(Date);
});

test('rejects invalid coordinates in the worker', async () => {
  await expect(workerPool.process({ fleetId: 'fleet-a', vehicleId: 'truck-1', latitude: 120, longitude: 80, speed: 45 })).rejects.toThrow(/latitude/);
});
