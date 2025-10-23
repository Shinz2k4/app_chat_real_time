import { useState, useEffect } from 'react';
import { api, authHeaders } from '../api';

export function useMessages(jwtToken, activeFriend) {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadMessages = async (friendUsername) => {
    if (!friendUsername) return;
    
    setMessages([]);
    
    try {
      const res = await fetch(`${api.chatBase}/history/${friendUsername}`, { 
        headers: { ...authHeaders(jwtToken) } 
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
    }
  };

  const addMessage = (msg) => {
    setMessages(prev => {
      // Avoid duplicate messages
      const exists = prev.some(m => m.id === msg.id);
      if (exists) return prev;
      return [...prev, msg];
    });
  };

  const sendMessage = (socket, friendUsername, message) => {
    if (!friendUsername || !message.trim()) return;
    socket.emit('send_message', { 
      receiver: friendUsername, 
      message: message.trim(),
      messageType: 'text'
    });
  };

  const sendFile = async (socket, friendUsername, file, caption, jwtToken) => {
    if (!friendUsername || !file) return;

    try {
      // Upload file to server first
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${api.chatBase}/upload`, {
        method: 'POST',
        headers: { ...authHeaders(jwtToken) },
        body: formData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      // Send message with attachment
      socket.emit('send_message', {
        receiver: friendUsername,
        message: caption || '',
        messageType: data.data.type,
        attachmentUrl: data.data.url,
        attachmentName: data.data.name,
        attachmentSize: data.data.size
      });

      return data.data;
    } catch (error) {
      console.error('❌ Failed to send file:', error);
      throw error;
    }
  };

  const joinChat = (socket, friendUsername) => {
    if (!friendUsername) return;
    socket.emit('join_chat', { friendUsername });
  };

  const leaveChat = (socket, friendUsername) => {
    if (!friendUsername || !socket) return;
    socket.emit('leave_chat', { friendUsername });
  };

  const sendTyping = (socket, friendUsername) => {
    if (!friendUsername || !socket) return;
    socket.emit('typing', { receiver: friendUsername });
  };

  const sendStopTyping = (socket, friendUsername) => {
    if (!friendUsername || !socket) return;
    socket.emit('stop_typing', { receiver: friendUsername });
  };

  const markAsRead = async (friendUsername) => {
    if (!friendUsername) return;
    
    try {
      const res = await fetch(`${api.chatBase}/mark-read/${friendUsername}`, {
        method: 'PUT',
        headers: { ...authHeaders(jwtToken) }
      });
      const data = await res.json();
      if (data.success) {
        console.log('✅ Messages marked as read');
        // Refresh unread count after marking as read
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${api.chatBase}/unread-count`, {
        headers: { ...authHeaders(jwtToken) }
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('❌ Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    if (activeFriend) {
      loadMessages(activeFriend);
      // Mark messages as read when opening chat
      // DISABLED: markAsRead(activeFriend);
    }
  }, [activeFriend, jwtToken]);

  // Fetch unread count on mount and periodically
  // DISABLED: Too frequent polling
  // useEffect(() => {
  //   if (jwtToken) {
  //     fetchUnreadCount();
  //     const interval = setInterval(fetchUnreadCount, 10000); // Every 10 seconds
  //     return () => clearInterval(interval);
  //   }
  // }, [jwtToken]);

  return {
    messages,
    unreadCount,
    addMessage,
    sendMessage,
    sendFile,
    joinChat,
    leaveChat,
    sendTyping,
    sendStopTyping,
    markAsRead,
    fetchUnreadCount,
    loadMessages
  };
}
