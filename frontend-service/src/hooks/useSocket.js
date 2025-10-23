import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket(jwtToken, onMessage, onError, onTyping, onStopTyping) {
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onTypingRef = useRef(onTyping);
  const onStopTypingRef = useRef(onStopTyping);
  const isConnectingRef = useRef(false);

  // Update refs when callbacks change (this won't cause reconnect)
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onTypingRef.current = onTyping;
    onStopTypingRef.current = onStopTyping;
  }, [onMessage, onError, onTyping, onStopTyping]);

  useEffect(() => {
    if (!jwtToken) {
      console.log('🚀 [SOCKET] No token, skipping WebSocket connection');
      return;
    }

    // Prevent multiple connections
    if (isConnectingRef.current || (socketRef.current && socketRef.current.connected)) {
      console.log('🔌 [SOCKET] Socket already exists or connecting, skipping...');
      return;
    }

    isConnectingRef.current = true;
    console.log('🚀 [SOCKET] Creating WebSocket connection');
    
    const socket = io('http://localhost:3003', {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token: jwtToken },
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('🔌 [SOCKET] WebSocket connected successfully');
      isConnectingRef.current = false;
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 [SOCKET] WebSocket disconnected:', reason);
      isConnectingRef.current = false;
    });
    
    socket.on('connected', (data) => {
      console.log('✅ [SOCKET] Chat service connected:', data);
    });
    
    socket.on('new_message', (msg) => {
      console.log('📨 [SOCKET] New message received:', msg);
      if (onMessageRef.current) {
        onMessageRef.current(msg);
      }
    });
    
    socket.on('message_sent', (msg) => {
      console.log('📤 [SOCKET] Message sent:', msg);
      if (onMessageRef.current) {
        onMessageRef.current(msg);
      }
    });
    
    socket.on('error', (error) => {
      console.log('❌ [SOCKET] WebSocket error:', error);
      if (onErrorRef.current) {
        onErrorRef.current(error.message || 'Socket error');
      }
    });

    socket.on('user_typing', (data) => {
      console.log('⌨️ [SOCKET] User typing:', data);
      if (onTypingRef.current) {
        onTypingRef.current(data.sender);
      }
    });

    socket.on('user_stop_typing', (data) => {
      console.log('⌨️ [SOCKET] User stop typing:', data);
      if (onStopTypingRef.current) {
        onStopTypingRef.current(data.sender);
      }
    });

    socket.on('joined_chat', (data) => {
      console.log('🏠 [SOCKET] Joined chat:', data);
    });

    socket.on('left_chat', (data) => {
      console.log('🚪 [SOCKET] Left chat:', data);
    });

    // Cleanup only on unmount or token change
    return () => {
      console.log('🔌 [SOCKET] Cleanup: Disconnecting WebSocket...');
      isConnectingRef.current = false;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, [jwtToken]); // Only reconnect when token changes

  return socketRef.current;
}
