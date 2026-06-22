import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import DirectChat from '../components/chat/DirectChat';

const Messages = () => {
  const { userId } = useParams(); // Optional — present when a conversation is open
  const navigate = useNavigate();
  const { isUserOnline } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null); // { userId, name } of open chat

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data.conversations);

      // If a conversation is open via URL, find its display info from the list
      if (userId) {
        const match = data.conversations.find((c) => c.userId === userId);
        if (match) setActiveUser({ userId: match.userId, name: match.name });
      }
    } catch {
      // Inbox failing to load is visible via the empty state, no toast needed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [userId]);

  const handleSelectConversation = (conv) => {
    setActiveUser({ userId: conv.userId, name: conv.name });
    navigate(`/messages/${conv.userId}`, { replace: true });
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      {/*  Conversation list  */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle size={18} /> Messages
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-12 px-4">
            No conversations yet. Visit a teammate's profile to start one.
          </p>
        ) : (
          <div className="divide-y divide-gray-800">
            {conversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-800/50 transition-colors ${
                  activeUser?.userId === conv.userId ? 'bg-gray-800/50' : ''
                }`}
              >
                <div className="relative shrink-0">
                  {conv.profileImage ? (
                    <img src={conv.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                      {conv.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isUserOnline(conv.userId) && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">{conv.name}</p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/*  Active chat window  */}
      <div className="md:col-span-2">
        {activeUser ? (
          <div className="h-full flex flex-col">
            <div className="bg-gray-900 border border-gray-800 rounded-t-xl px-4 py-3 flex items-center gap-2">
              <span className="text-white font-medium text-sm">{activeUser.name}</span>
              {isUserOnline(activeUser.userId) && (
                <span className="text-xs text-green-400">● Online</span>
              )}
            </div>
            <div className="flex-1 -mt-px">
              <DirectChat otherUserId={activeUser.userId} otherUserName={activeUser.name} />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-900 border border-gray-800 rounded-xl">
            <p className="text-gray-500 text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;