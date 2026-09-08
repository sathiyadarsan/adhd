import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { ChatMessage } from '../types';
import { cn } from '../utils/helpers';

export function ChatView() {
  const { state, dispatch } = useAppContext();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMessage });
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: 'AI response coming soon...',
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiMessage });
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full h-[calc(100vh-6rem)]">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {state.chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            Send a message to start chatting
          </div>
        ) : (
          state.chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex w-full',
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                )}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-indigo-600 text-white p-2.5 rounded-full disabled:opacity-50 transition-opacity"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
