import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    // No user logged in — make sure any existing connection is torn down
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('devforge_token');
    if (!token) return;

    //  Establish the connection 
    const socket = io(SOCKET_URL, {
      auth: { token }, // Read by the backend's io.use() middleware
      transports: ['websocket'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('user-online', ({ userId }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    });

    socket.on('user-offline', ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socketRef.current = socket;

    //  Cleanup: runs when the user logs out or the provider unmounts 
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id]);

  const isUserOnline = (userId) => onlineUserIds.has(userId?.toString());

  const value = {
    socket: socketRef.current,
    connected,
    isUserOnline,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};