const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const TelemetryBucket = require('../models/TelemetryBucket');

const getDashboardStats = async (_req, res) => {
  try {
    const [totalVehicles, activeVehicles, totalDrivers, todayTrips, latestBucket] = await Promise.all([
      Vehicle.countDocuments(), Vehicle.countDocuments({ status: 'Active' }), Driver.countDocuments(),
      Trip.countDocuments({ tripDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      TelemetryBucket.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
    ]);
    res.json({ totalVehicles, activeVehicles, inactiveVehicles: totalVehicles - activeVehicles, totalDrivers, todayTrips, telemetryUpdatedAt: latestBucket?.updatedAt || null });
  } catch (error) { res.status(500).json({ message: 'Unable to load dashboard statistics', error: error.message }); }
};
module.exports = { getDashboardStats };
