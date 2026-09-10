import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import { Send, Bot, User } from 'lucide-react';

export function ChatView() {
  const { state, dispatch } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.pendingChatQuery) {
      handleSendMessage(state.pendingChatQuery);
      dispatch({ type: 'SET_PENDING_CHAT_QUERY', payload: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingChatQuery]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

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

    setTimeout(() => {
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: {
          id: generateId(),
          text: "AI response initiated. This is a hardcoded placeholder ready for API integration.",
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
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] md:h-[calc(100vh-140px)] flex flex-col pb-8">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold text-slate-100">Ask AI</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 mb-6 bg-theme-card/50 backdrop-blur-sm border border-theme-border/50 rounded-2xl p-6 shadow-sm">

        {state.chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="bg-theme-card p-4 rounded-2xl border border-theme-border/50 shadow-sm">
              <Bot className="w-8 h-8 text-theme-accent" />
            </div>
            <p className="text-sm font-medium">How can I optimize your day?</p>
          </div>
        ) : (
          state.chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-xl shadow-sm ${
                msg.sender === 'user' ? 'bg-theme-accent text-white' : 'bg-theme-card text-theme-accent border border-theme-border/50'
              }`}>
                {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div className={`p-4 text-sm font-medium leading-relaxed rounded-2xl shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-theme-accent text-white rounded-tr-sm'
                  : 'bg-theme-card border border-theme-border/50 text-slate-200 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <form onSubmit={onSubmit} className="relative shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your query here..."
          className="w-full pl-6 pr-16 py-4 bg-theme-card border border-theme-border/50 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-accent/50 transition-shadow shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-theme-accent text-white rounded-xl disabled:opacity-50 disabled:bg-theme-border hover:bg-theme-accent transition-colors shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
