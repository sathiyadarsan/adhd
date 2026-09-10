import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import type { InboxItem } from '../types';
import { Trash2, CalendarPlus, Inbox } from 'lucide-react';

export function InboxView() {
  const { state, dispatch } = useAppContext();
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: InboxItem = {
      id: generateId(),
      text: newItemText,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_INBOX_ITEM', payload: newItem });
    setNewItemText('');
  };

  const handleSchedule = (item: InboxItem) => {
    dispatch({
      type: 'OPEN_TASK_FAB',
      payload: { initialTitle: item.text }
    });
    dispatch({ type: 'DELETE_INBOX_ITEM', payload: item.id });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'today' });
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_INBOX_ITEM', payload: id });
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Brain Dump</h1>
        <p className="text-slate-400 mt-2">Capture thoughts quickly, schedule them later.</p>
      </div>

      <div className="bg-theme-card/50 backdrop-blur-sm border border-theme-border/50 rounded-2xl p-6 mb-8 shadow-sm">
        <form onSubmit={handleAddItem} className="relative">
          <input
            autoFocus
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Type anything on your mind..."
            className="w-full pl-4 pr-16 py-3 bg-theme-bg border border-theme-border/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-accent/30 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!newItemText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-theme-accent text-white rounded-lg disabled:opacity-50 disabled:bg-theme-border hover:bg-theme-accent transition-colors"
          >
            <Inbox className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {state.inboxItems.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-dashed border-theme-border/50 rounded-2xl bg-theme-card/20">
            <Inbox className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-50" />
            <p className="font-medium text-lg text-slate-400">Inbox Zero</p>
            <p className="text-sm opacity-70 mt-1">Your mind is clear.</p>
          </div>
        ) : (
          state.inboxItems.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-theme-card/50 backdrop-blur-sm border border-theme-border/50 rounded-xl hover:border-theme-border transition-colors shadow-sm group"
            >
              <div className="flex-1">
                <p className="text-slate-200 font-medium">{item.text}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSchedule(item)}
                  className="flex items-center gap-2 bg-theme-border text-slate-200 px-3 py-2 rounded-lg font-medium text-sm hover:bg-slate-600 transition-colors"
                >
                  <CalendarPlus className="w-4 h-4 text-theme-accent" />
                  <span className="hidden sm:inline">Schedule</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:bg-theme-border hover:text-red-400 rounded-lg transition-colors"
                  aria-label="Delete item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
