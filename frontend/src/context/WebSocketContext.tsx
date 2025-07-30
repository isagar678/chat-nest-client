import React, { createContext, useEffect, useMemo, useContext } from 'react';
import { Socket, io } from 'socket.io-client';
import AuthContext from './AuthContext';

export const SocketContext = createContext<Socket | null>(null);

type Props = {
  children: React.ReactNode;
};

export const SocketProvider: React.FC<Props> = ({ children }) => {
  const { accessToken } = useContext(AuthContext);

  const socket = useMemo(() => {
    if (!accessToken) {
      return null;
    }
    
    return io('http://localhost:3000', {
      transports: ['websocket'],
      extraHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }, [accessToken]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect(); // clean up on unmount
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};