const TelemetryBucket = require('../../models/TelemetryBucket');

function hourFloor(date) {
  const value = new Date(date);
  value.setUTCMinutes(0, 0, 0);
  return value;
}

async function persistTelemetry(item, geofenceState = 'outside') {
  const hour = hourFloor(item.recordedAt);
  const point = {
    vehicleId: item.vehicleId, recordedAt: item.recordedAt,
    latitude: item.location.latitude, longitude: item.location.longitude,
    speed: item.location.speed, heading: item.location.heading, geofenceState,
  };
  // $push preserves every accepted point; hourly buckets are bounded to 10,000 points.
  const filter = { fleetId: item.fleetId, hour, count: { $lt: 10000 } };
  let result = await TelemetryBucket.findOneAndUpdate(filter, {
    $push: { points: point }, $inc: { count: 1 }, $setOnInsert: { fleetId: item.fleetId, hour },
  }, { returnDocument: 'after', upsert: false });
  if (!result) {
    try {
      result = await TelemetryBucket.create({ fleetId: item.fleetId, hour, count: 1, points: [point] });
    } catch (error) {
      if (error.code !== 11000) throw error;
      result = await TelemetryBucket.findOneAndUpdate({ fleetId: item.fleetId, hour, count: { $lt: 10000 } }, {
        $push: { points: point }, $inc: { count: 1 },
      }, { returnDocument: 'after' });
      if (!result) throw new Error('Hourly telemetry bucket is full; telemetry was not persisted');
    }
  }
  return result;
}
module.exports = { persistTelemetry };
