const { checkGeofences } = require('../src/realtime/services/geofenceService');

test('detects a boundary transition after initial state is established', () => {
  const id = `test-${Date.now()}`;
  checkGeofences(id, 'truck-1', { latitude: 0, longitude: 0 });
  const events = checkGeofences(id, 'truck-1', { latitude: 12.9716, longitude: 77.5946 });
  expect(events.some((event) => event.event === 'ENTERED')).toBe(true);
});
