import { useState, useRef, useEffect } from 'react';
import { Search, CalendarDays, CheckSquare, BedDouble, MessageSquare, Bot } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { TabName } from '../../context/AppContext';

import { TodayView } from '../../views/TodayView';
import { HabitsView } from '../../views/HabitsView';
import { SleepView } from '../../views/SleepView';
import { ChatView } from '../../views/ChatView';

export function PageShell() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { state, dispatch } = useAppContext();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems: { name: string; id: TabName; icon: any }[] = [
    { name: 'Today', id: 'today', icon: CheckSquare },
    { name: 'Habits & Calendar', id: 'habits', icon: CalendarDays },
    { name: 'Sleep', id: 'sleep', icon: BedDouble },
    { name: 'Chat', id: 'chat', icon: MessageSquare },
  ];

  const handleAskAI = () => {
    if (!searchQuery.trim()) return;
    dispatch({ type: 'SET_PENDING_CHAT_QUERY', payload: searchQuery });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'chat' });
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // Search logic
  const searchLower = searchQuery.toLowerCase();
  const matchedTasks = state.tasks.filter(t => t.title.toLowerCase().includes(searchLower)).slice(0, 3);
  const matchedHabits = state.habits.filter(h => h.name.toLowerCase().includes(searchLower)).slice(0, 3);
  const showResults = searchQuery.trim().length > 0 && isDropdownOpen;

  const navigateToTab = (tab: TabName) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const renderContent = () => {
    switch (state.activeTab) {
      case 'today': return <TodayView />;
      case 'habits': return <HabitsView />;
      case 'sleep': return <SleepView />;
      case 'chat': return <ChatView />;
      default: return <TodayView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900 shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold text-amber-500 tracking-tight">Productivity</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-2">
          {navItems.map((item) => {
            const isActive = state.activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: item.id })}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all border-l-4 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500 font-medium'
                    : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header / Global Search */}
        <header className="h-20 flex items-center justify-center px-4 md:px-8 border-b border-slate-800/50 relative shrink-0">
          <div className="w-full max-w-2xl relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search tasks, habits, or ask AI..."
                className="w-full bg-slate-800 text-slate-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400 border border-slate-700 shadow-sm"
              />
            </div>

            {/* Dropdown Results */}
            {showResults && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                  {matchedTasks.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks</div>
                      {matchedTasks.map(t => (
                        <button
                          key={t.id}
                          onClick={() => navigateToTab('today')}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800 flex items-center gap-3 text-slate-200"
                        >
                          <CheckSquare className="w-4 h-4 text-amber-500" />
                          <span className="truncate">{t.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedHabits.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Habits</div>
                      {matchedHabits.map(h => (
                        <button
                          key={h.id}
                          onClick={() => navigateToTab('habits')}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800 flex items-center gap-3 text-slate-200"
                        >
                          <CalendarDays className="w-4 h-4 text-amber-500" />
                          <span className="truncate">{h.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-800 mt-2 pt-2">
                    <button
                      onClick={handleAskAI}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-amber-500/10 flex items-center gap-3 text-amber-500 transition-colors font-medium"
                    >
                      <Bot className="w-5 h-5" />
                      <span className="truncate">Ask AI: "{searchQuery}"</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Mobile TabBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: item.id })}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              state.activeTab === item.id ? 'text-amber-500' : 'text-slate-500'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
