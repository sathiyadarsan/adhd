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
          text: "AI RESPONSE INITIATED. THIS IS A HARDCODED PLACEHOLDER READY FOR API INTEGRATION.",
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
      <h1 className="text-4xl text-white mb-6 border-b-4 border-white pb-4 inline-block pr-12 shrink-0">Ask AI</h1>

      <div className="flex-1 overflow-y-auto space-y-6 mb-6 bg-brand-card border-4 border-white shadow-brutal p-6">

        {state.chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white space-y-6">
            <div className="bg-brand-bg p-4 border-4 border-white shadow-brutal-sm">
              <Bot className="w-16 h-16 stroke-[3]" />
            </div>
            <p className="text-xl font-black uppercase tracking-widest text-center">HOW CAN I OPTIMIZE<br/>YOUR DAY?</p>
          </div>
        ) : (
          state.chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-12 h-12 flex items-center justify-center flex-shrink-0 border-4 border-brand-bg shadow-[2px_2px_0px_0px_#000] ${
                msg.sender === 'user' ? 'bg-brand-accent text-brand-bg' : 'bg-white text-brand-bg'
              }`}>
                {msg.sender === 'user' ? <User className="w-6 h-6 stroke-[3]" /> : <Bot className="w-6 h-6 stroke-[3]" />}
              </div>

              <div className={`p-5 text-lg font-bold border-4 border-brand-bg shadow-[4px_4px_0px_0px_#000] ${
                msg.sender === 'user'
                  ? 'bg-brand-accent text-brand-bg'
                  : 'bg-white text-brand-bg'
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
          placeholder="TYPE YOUR QUERY HERE..."
          className="brutal-input w-full pr-20 text-lg shadow-brutal"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-brand-accent border-4 border-brand-bg text-brand-bg disabled:opacity-50 hover:bg-white transition-colors shadow-[2px_2px_0px_0px_#000]"
        >
          <Send className="w-6 h-6 stroke-[3]" />
        </button>
      </form>
    </div>
  );
}
