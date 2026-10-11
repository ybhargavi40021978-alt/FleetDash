import { io } from "socket.io-client";
import { SOCKET_EVENTS } from "./socketEvents";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.io.on("reconnect", () => console.log("Reconnected"));
socket.io.on("reconnect_attempt", () => console.log("Trying to reconnect..."));
socket.io.on("reconnect_failed", () => console.log("Unable to reconnect"));

socket.on("reconnect", () => {
    console.log("Reconnected");
});

socket.on("reconnect_attempt", () => {
    console.log("Trying to reconnect...");
});

socket.on("reconnect_failed", () => {
    console.log("Unable to reconnect");
});


export const subscribeToSocket = (event, handler) => {
  socket.on(event, handler);
  return () => socket.off(event, handler);
};

export const emitSocketEvent = (event, payload) => socket.emit(event, payload);
export const emitVehicleLocation = (location, acknowledge) => socket.emit(SOCKET_EVENTS.VEHICLE_LOCATION, location, acknowledge);
export const joinFleet = (fleetId, acknowledge) => socket.emit(SOCKET_EVENTS.JOIN_FLEET, fleetId, acknowledge);
export const connectSocket = () => { if (!socket.connected) socket.connect(); };
export const disconnectSocket = () => { if (socket.connected) socket.disconnect(); };