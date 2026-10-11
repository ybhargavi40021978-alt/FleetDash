import * as turf from "@turf/turf";

export const isVehicleInsideGeofence = (
  latitude,
  longitude,
  geofence
) => {
  const point = turf.point([longitude, latitude]);

  const circle = turf.circle(
    [geofence.center[1], geofence.center[0]],
    geofence.radius / 1000,
    {
      units: "kilometers",
    }
  );

  return turf.booleanPointInPolygon(point, circle);
};