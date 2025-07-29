// useSocketEvents.ts
import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

type HandlerMap = {
  [event: string]: (...args: any[]) => void;
};

export const useSocketEvents = (socket: Socket , handlers: HandlerMap,) => {
  useEffect(() => {
    if (!socket) return;

    // Attach all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup on unmount or socket change
    return () => {
      Object.keys(handlers).forEach((event) => {
        socket.off(event);
      });
    };
  }, [socket, handlers]);
};
