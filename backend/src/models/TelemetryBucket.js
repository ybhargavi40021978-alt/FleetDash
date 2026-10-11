const mongoose = require('mongoose');

const telemetryPointSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true },
  recordedAt: { type: Date, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  heading: { type: Number, default: 0 },
  geofenceState: { type: String, enum: ['inside', 'outside'], default: 'outside' },
}, { _id: false });

const bucketSchema = new mongoose.Schema({
  fleetId: { type: String, required: true },
  hour: { type: Date, required: true },
  count: { type: Number, default: 0 },
  points: { type: [telemetryPointSchema], default: [] },
}, { timestamps: true, versionKey: false });

bucketSchema.index({ fleetId: 1, hour: 1 }, { unique: true });
bucketSchema.index({ fleetId: 1, 'points.vehicleId': 1, 'points.recordedAt': -1 });
bucketSchema.index({ 'points.recordedAt': 1 }, { expireAfterSeconds: Number(process.env.TELEMETRY_TTL_SECONDS || 2592000) });
module.exports = mongoose.model('TelemetryBucket', bucketSchema);
