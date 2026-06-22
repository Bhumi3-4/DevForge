import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ChatWindow = ({
  messages,
  loading,
  onSend,
  onTyping,
  typingUsers = [],
  emptyText = 'No messages yet. Say hello!',
}) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Message list */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-12">{emptyText}</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender?._id === user?._id;
            return (
              <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isOwn && (
                    <span className="text-xs text-gray-500 mb-0.5 px-1">{msg.sender?.name}</span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-600 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <p className="text-xs text-gray-500 italic px-1">
            {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : 'Several people are typing...'}
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping?.();
          }}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;