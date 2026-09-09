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
    <div className="flex h-screen w-full bg-brand-bg text-white overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r-4 border-white bg-brand-bg z-20 relative">
        <div className="p-6 border-b-4 border-white">
          <h1 className="text-3xl text-white">Productivity</h1>
        </div>
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = state.activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: item.id })}
                className={`w-full flex items-center space-x-3 px-4 py-4 border-4 transition-all uppercase font-bold tracking-wider ${
                  isActive
                    ? 'bg-brand-accent text-brand-bg border-brand-accent shadow-brutal-accent translate-x-[-2px] translate-y-[-2px]'
                    : 'bg-brand-bg text-white border-white hover:bg-white hover:text-brand-bg'
                }`}
              >
                <item.icon className="w-6 h-6 stroke-[3]" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header / Global Search */}
        <header className="h-24 flex items-center justify-center px-4 md:px-8 border-b-4 border-white relative shrink-0 z-30 bg-brand-bg">
          <div className="w-full max-w-2xl relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white stroke-[3] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="SEARCH TASKS OR ASK AI..."
                className="brutal-input w-full pl-14 font-bold tracking-wider shadow-brutal"
              />
            </div>

            {/* Dropdown Results */}
            {showResults && (
              <div className="absolute top-[calc(100%+16px)] left-0 w-full bg-brand-bg border-4 border-white shadow-brutal z-50">
                <div className="p-0 max-h-96 overflow-y-auto divide-y-4 divide-white">
                  {matchedTasks.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-sm font-black bg-white text-brand-bg uppercase">Tasks</div>
                      {matchedTasks.map(t => (
                        <button
                          key={t.id}
                          onClick={() => navigateToTab('today')}
                          className="w-full text-left px-4 py-4 hover:bg-white hover:text-brand-bg flex items-center gap-3 text-white transition-colors font-bold"
                        >
                          <CheckSquare className="w-5 h-5 text-brand-accent stroke-[3]" />
                          <span className="truncate">{t.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedHabits.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-sm font-black bg-white text-brand-bg uppercase">Habits</div>
                      {matchedHabits.map(h => (
                        <button
                          key={h.id}
                          onClick={() => navigateToTab('habits')}
                          className="w-full text-left px-4 py-4 hover:bg-white hover:text-brand-bg flex items-center gap-3 text-white transition-colors font-bold"
                        >
                          <CalendarDays className="w-5 h-5 text-brand-accent stroke-[3]" />
                          <span className="truncate">{h.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <button
                      onClick={handleAskAI}
                      className="w-full text-left px-4 py-4 hover:bg-brand-accent hover:text-brand-bg flex items-center gap-3 text-brand-accent transition-colors font-black uppercase tracking-wider"
                    >
                      <Bot className="w-6 h-6 stroke-[3]" />
                      <span className="truncate">Ask AI: "{searchQuery}"</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-brand-bg">
          {renderContent()}
        </main>
      </div>

      {/* Mobile TabBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 bg-brand-bg border-t-4 border-white flex items-center z-50 divide-x-4 divide-white">
        {navItems.map((item) => {
          const isActive = state.activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: item.id })}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'bg-brand-accent text-brand-bg' : 'bg-brand-bg text-white hover:bg-white hover:text-brand-bg'
              }`}
            >
              <item.icon className="w-6 h-6 stroke-[3]" />
              <span className="text-[10px] font-black uppercase tracking-wider">{item.name}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
}
