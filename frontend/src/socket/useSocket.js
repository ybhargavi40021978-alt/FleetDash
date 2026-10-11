import { useEffect } from "react";
import { connectSocket, disconnectSocket, subscribeToSocket } from "./socket";

export const useSocket = (handlers = []) => {
  useEffect(() => {
    connectSocket();

    const cleanup = handlers.map(({ event, handler }) => subscribeToSocket(event, handler));

    return () => {
      cleanup.forEach((unsubscribe) => unsubscribe());
      disconnectSocket();
    };
  }, [handlers]);
};
