import React, { createContext, useEffect, useMemo, useContext } from 'react';
import { Socket, io } from 'socket.io-client';
import AuthContext from './AuthContext';
import { getWebSocketUrl } from '@/lib/utils';

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
    return io(getWebSocketUrl(), {
      transports: ['websocket'],
      auth: {
        token: accessToken,
      },
    });
  }, [accessToken]);


  useEffect(() => {
    return () => {
      if (socket) {
        // Ensure transport and listeners are fully cleaned up
        try { socket.removeAllListeners(); } catch {}
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};