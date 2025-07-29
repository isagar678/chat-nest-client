import React, { createContext, useEffect, useMemo } from 'react';
import { Socket, io } from 'socket.io-client';

export const SocketContext = createContext<Socket | null>(null);

type Props = {
  token: string;
  children: React.ReactNode;
};

export const SocketProvider: React.FC<Props> = ({ token, children }) => {
    const socket = useMemo(() => {
      return io('http://localhost:3000', {
        transports: ['websocket'],
        extraHeaders: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNhIiwiaWQiOjIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUzNzg1NTI2LCJleHAiOjE3NTM4NzE5MjZ9.MQqfL2lwEi30WJ5zo1-DsBZcIgcfY8vwXwGOXAkiHlE`,
        },
      });
    }, [token]);
  
    useEffect(() => {
      return () => {
        socket.disconnect(); // clean up on unmount
      };
    }, [socket]);
  
    return (
      <SocketContext.Provider value={socket}>
        {children}
      </SocketContext.Provider>
    );
  };