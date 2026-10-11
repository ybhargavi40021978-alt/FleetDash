const vehicles = Object.create(null);

function keyFor(fleetId, vehicleId) {
  return `${fleetId}:${vehicleId}`;
}

function updateVehicleLocation(fleetId, vehicleId, location) {
  const key = keyFor(fleetId, vehicleId);
  const vehicle = vehicles[key] || { fleetId, vehicleId };
  vehicle.location = location;
  vehicle.updatedAt = new Date();
  vehicles[key] = vehicle;
  return vehicle;
}

function getVehicleLocation(fleetId, vehicleId) {
  return vehicles[keyFor(fleetId, vehicleId)] || null;
}

module.exports = { updateVehicleLocation, getVehicleLocation };