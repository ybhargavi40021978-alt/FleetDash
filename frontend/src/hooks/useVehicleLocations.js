import { useCallback, useEffect, useMemo, useState } from "react";
import { SOCKET_EVENTS } from "../socket/socketEvents";
import { emitVehicleLocation, joinFleet as joinFleetRoom, subscribeToSocket } from "../socket/socket";

export function useVehicleLocations() {
  const [locations, setLocations] = useState({});
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [joinedFleet, setJoinedFleet] = useState("");

  useEffect(() => {
    const unsubscribeLocation = subscribeToSocket(SOCKET_EVENTS.VEHICLE_LOCATION, (vehicle) => {
      setLocations((current) => ({ ...current, [`${vehicle.fleetId}:${vehicle.vehicleId}`]: vehicle }));
      setEvents((current) => [{ ...vehicle, receivedAt: new Date().toISOString() }, ...current].slice(0, 8));
    });
    const unsubscribeAlert = subscribeToSocket(SOCKET_EVENTS.GEOFENCE_ALERT, (alert) => {
      setAlerts((current) => [alert, ...current].slice(0, 8));
    });
    const unsubscribeJoined = subscribeToSocket(SOCKET_EVENTS.JOINED_FLEET, setJoinedFleet);
    return () => { unsubscribeLocation(); unsubscribeAlert(); unsubscribeJoined(); };
  }, []);

  const vehicles = useMemo(() => Object.values(locations).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [locations]);
  const sendLocation = useCallback((location, acknowledge) => emitVehicleLocation(location, acknowledge), []);
  const joinFleet = useCallback((fleetId, acknowledge) => joinFleetRoom(fleetId, acknowledge), []);
  return { vehicles, events, alerts, sendLocation, joinFleet, joinedFleet };
}