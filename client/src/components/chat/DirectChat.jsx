import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';

const DirectChat = ({ otherUserId, otherUserName }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  //  Fetch history whenever the selected conversation changes 
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/messages/direct/${otherUserId}`);
        setMessages(data.messages);
      } catch {
        // Degrade gracefully — empty history, live chat still works
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [otherUserId]);

  //  Listen for live incoming messages from THIS specific conversation 
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Only show messages belonging to the conversation currently open —
      // the socket layer broadcasts ALL of a user's DMs, not room-scoped
      const isThisConversation =
        (message.sender?._id === otherUserId) ||
        (message.sender?._id === user?._id && message.recipient === otherUserId);

      if (!isThisConversation) return;

      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleTyping = ({ userId }) => {
      if (userId !== otherUserId) return;
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    };

    socket.on('new-direct-message', handleNewMessage);
    socket.on('user-typing', handleTyping);

    return () => {s
      socket.off('new-direct-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
    };
  }, [socket, otherUserId, user?._id]);

  const handleSend = useCallback(
    (content) => {
      if (!socket) return;
      socket.emit('send-direct-message', { recipientId: otherUserId, content });
    },
    [socket, otherUserId]
  );

  const typingThrottleRef = useRef(false);
  const handleTypingEmit = () => {
    if (!socket || typingThrottleRef.current) return;
    socket.emit('typing-direct', { recipientId: otherUserId });
    typingThrottleRef.current = true;
    setTimeout(() => {
      typingThrottleRef.current = false;
    }, 2000);
  };

  return (
    <ChatWindow
      messages={messages}
      loading={loading}
      onSend={handleSend}
      onTyping={handleTypingEmit}
      typingUsers={isTyping ? [otherUserName] : []}
      emptyText={`No messages yet. Say hello to ${otherUserName}!`}
    />
  );
};

export default DirectChat;