import React, { createContext, useContext, useEffect, useState } from "react";
import { socket } from "../socket/socket";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [transport, setTransport] = useState("N/A");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    setIsConnected(socket.connected);
    if (socket.io && socket.io.engine) {
      setTransport(socket.io.engine.transport.name);
    }

    const onConnect = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      if (socket.io && socket.io.engine) {
        setTransport(socket.io.engine.transport.name);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setTransport("N/A");
    };

    const onReconnectAttempt = (attempt) => {
      setReconnectAttempts(attempt);
    };

    const onReconnectFailed = () => {
      setReconnectAttempts(0);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    
    if (socket.io) {
      socket.io.on("reconnect_attempt", onReconnectAttempt);
      socket.io.on("reconnect", onConnect);
      socket.io.on("reconnect_failed", onReconnectFailed);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      if (socket.io) {
        socket.io.off("reconnect_attempt", onReconnectAttempt);
        socket.io.off("reconnect", onConnect);
        socket.io.off("reconnect_failed", onReconnectFailed);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, transport, reconnectAttempts }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
