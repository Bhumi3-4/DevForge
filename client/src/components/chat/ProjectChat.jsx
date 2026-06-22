import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';

const ProjectChat = ({ projectId }) => {
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingNames, setTypingNames] = useState(new Map()); // userId -> name
  const typingTimeoutRef = useRef({});

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/messages/project/${projectId}`);
        setMessages(data.messages);
      } catch {
        // A failed history fetch shouldn't block live chat from working —
        // the user just starts with an empty window instead of full history
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [projectId]);

  //  Join the room and listen for live events 
  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit('join-project', projectId);

    const handleNewMessage = (message) => {
      // Guard against double-delivery if this component re-subscribes
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleTyping = ({ userId, projectId: typingProjectId }) => {
      if (typingProjectId !== projectId || userId === user?._id) return;
      // We don't have the typer's name from this event 
      setTypingNames((prev) => new Map(prev).set(userId, 'Someone'));

      // Clear this user's typing indicator after 3s of silence
      clearTimeout(typingTimeoutRef.current[userId]);
      typingTimeoutRef.current[userId] = setTimeout(() => {
        setTypingNames((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }, 3000);
    };

    socket.on('new-project-message', handleNewMessage);
    socket.on('user-typing', handleTyping);

    return () => {
      socket.emit('leave-project', projectId);
      socket.off('new-project-message', handleNewMessage);
      socket.off('user-typing', handleTyping);
    };
  }, [socket, connected, projectId, user?._id]);

  const handleSend = useCallback(
    (content) => {
      if (!socket) return;
      socket.emit('send-project-message', { projectId, content });
    },
    [socket, projectId]
  );

  //  Emit a typing event, throttled to avoid flooding the socket 
  const typingThrottleRef = useRef(false);
  const handleTypingEmit = () => {
    if (!socket || typingThrottleRef.current) return;
    socket.emit('typing-project', { projectId });
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
      typingUsers={Array.from(typingNames.values())}
      emptyText="No messages yet. Start the conversation with your team."
      onTyping={handleTypingEmit}
    />
  );
};

export default ProjectChat;