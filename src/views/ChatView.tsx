import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import { Send, Bot, User } from 'lucide-react';

export function ChatView() {
  const { state, dispatch } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Handle handoff from global search
  useEffect(() => {
    if (state.pendingChatQuery) {
      handleSendMessage(state.pendingChatQuery);
      // clear the pending query so it doesn't fire again
      dispatch({ type: 'SET_PENDING_CHAT_QUERY', payload: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingChatQuery]);

  // Auto scroll to bottom
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add User message
    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      payload: {
        id: generateId(),
        text,
        sender: 'user',
        timestamp: new Date().toISOString()
      }
    });

    setInputValue('');

    // Simulate AI response delay
    setTimeout(() => {
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          id: generateId(),
          text: "AI response coming soon. (This is a placeholder that can be connected to a real API).",
          sender: 'assistant',
          timestamp: new Date().toISOString()
        }
      });
    }, 1000);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] flex flex-col pb-6">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg">

        {state.chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Bot className="w-12 h-12 text-slate-600" />
            <p className="text-sm">How can I help you manage your day?</p>
          </div>
        ) : (
          state.chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.sender === 'user' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-amber-500 border border-slate-700'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`p-4 rounded-2xl text-sm ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-slate-900 rounded-tr-none'
                  : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <form onSubmit={onSubmit} className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask AI for productivity tips..."
          className="w-full bg-slate-900 text-slate-100 rounded-2xl px-6 py-4 pr-14 outline-none focus:ring-2 focus:ring-amber-500 border border-slate-800 shadow-lg placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-amber-500 text-slate-900 rounded-xl disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
