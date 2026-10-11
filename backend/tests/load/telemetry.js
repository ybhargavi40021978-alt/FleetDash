import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    telemetry_ingestion: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.RATE || 2000),
      timeUnit: '1s',
      duration: __ENV.DURATION || '30s',
      preAllocatedVUs: 100,
      maxVUs: 1000,
    },
  },
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<250'] },
};

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:5000';
  const vehicleNumber = `load-${__VU}-${__ITER}`;
  const payload = JSON.stringify({
    fleetId: 'load-test-fleet', vehicleId: vehicleNumber,
    latitude: 12.90 + Math.random() * 0.15,
    longitude: 77.50 + Math.random() * 0.15,
    speed: 20 + Math.random() * 90, heading: Math.random() * 360,
    recordedAt: new Date().toISOString(),
  });
  const response = http.post(`${base}/api/telemetry/batch`, payload, { headers: { 'Content-Type': 'application/json' } });
  check(response, { 'telemetry accepted': (r) => r.status === 202 });
}
