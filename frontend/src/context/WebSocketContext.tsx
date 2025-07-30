import React, { createContext, useEffect, useMemo, useContext } from 'react';
import { Socket, io } from 'socket.io-client';
import AuthContext from './AuthContext';

export const SocketContext = createContext<Socket | null>(null);

type Props = {
  children: React.ReactNode;
};

export const SocketProvider: React.FC<Props> = ({ children }) => {
  const { accessToken } = useContext(AuthContext);
  
  console.log(accessToken,'accesstoken')


  const socket = useMemo(() => {
    if (!accessToken) {
      return null;
    }
    console.log('making 2nd attempt')
    return io('http://localhost:3000', {
      transports: ['websocket'],
      auth: {
        token: accessToken,
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