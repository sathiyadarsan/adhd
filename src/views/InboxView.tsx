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
    // Open the Task FAB with this item's text
    dispatch({
      type: 'OPEN_TASK_FAB',
      payload: { initialTitle: item.text }
    });
    // Remove it from the inbox
    dispatch({ type: 'DELETE_INBOX_ITEM', payload: item.id });
    // Switch to Today view so they can see the FAB and the result
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'today' });
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_INBOX_ITEM', payload: id });
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24">
      <h1 className="text-4xl text-white mb-8 border-b-4 border-white pb-4 inline-block pr-12">Brain Dump</h1>

      <div className="bg-brand-card border-4 border-white shadow-brutal p-6 mb-8">
        <form onSubmit={handleAddItem} className="relative">
          <input
            autoFocus
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="TYPE ANYTHING ON YOUR MIND..."
            className="brutal-input w-full text-lg shadow-brutal pr-16"
          />
          <button
            type="submit"
            disabled={!newItemText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-accent border-4 border-brand-bg text-brand-bg disabled:opacity-50 hover:bg-white transition-colors shadow-[2px_2px_0px_0px_#000]"
          >
            <Inbox className="w-6 h-6 stroke-[3]" />
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {state.inboxItems.length === 0 ? (
          <div className="text-center py-12 text-white border-4 border-dashed border-white bg-brand-bg font-bold tracking-widest uppercase">
            INBOX ZERO
            <br />
            <span className="text-xs opacity-70">YOUR MIND IS CLEAR.</span>
          </div>
        ) : (
          state.inboxItems.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-brand-bg border-4 border-white shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all group"
            >
              <div className="flex-1">
                <p className="text-white font-bold text-lg leading-tight">{item.text}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSchedule(item)}
                  className="flex items-center gap-2 bg-brand-accent border-4 border-brand-bg text-brand-bg px-3 py-2 font-black uppercase text-xs hover:bg-white hover:text-brand-bg transition-colors shadow-[2px_2px_0px_0px_#000]"
                >
                  <CalendarPlus className="w-4 h-4 stroke-[3]" />
                  <span className="hidden sm:inline">Schedule</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-white hover:bg-white hover:text-brand-bg border-4 border-transparent hover:border-brand-bg transition-all"
                >
                  <Trash2 className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
