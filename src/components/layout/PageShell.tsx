import { useState, useRef, useEffect } from 'react';
import { Search, CalendarDays, CheckSquare, BedDouble, MessageSquare, Bot, Inbox, Download, Upload } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { TabName } from '../../context/AppContext';

import { TodayView } from '../../views/TodayView';
import { HabitsView } from '../../views/HabitsView';
import { SleepView } from '../../views/SleepView';
import { ChatView } from '../../views/ChatView';
import { InboxView } from '../../views/InboxView';

export function PageShell() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state, dispatch } = useAppContext();

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
    { name: 'Inbox', id: 'inbox', icon: Inbox },
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

  const searchLower = searchQuery.toLowerCase();
  const matchedTasks = state.tasks.filter(t => t.title.toLowerCase().includes(searchLower)).slice(0, 3);
  const matchedHabits = state.habits.filter(h => h.name.toLowerCase().includes(searchLower)).slice(0, 3);
  const showResults = searchQuery.trim().length > 0 && isDropdownOpen;

  const navigateToTab = (tab: TabName) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleExport = () => {
    const { pendingChatQuery, activeTab, fabState, ...dataToExport } = state;
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `adhd_app_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (window.confirm("Are you sure you want to import data? This will overwrite your current app state entirely.")) {
          if (!parsed.tasks) parsed.tasks = [];
          if (!parsed.habits) parsed.habits = [];
          if (!parsed.sleepEntries) parsed.sleepEntries = [];
          if (!parsed.chatMessages) parsed.chatMessages = [];
          if (!parsed.inboxItems) parsed.inboxItems = [];

          dispatch({ type: 'SET_STATE', payload: parsed });
          alert("Data imported successfully!");
        }
      } catch (err) {
        console.error("Import failed:", err);
        alert("Failed to parse import file. Ensure it is a valid JSON backup.");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const renderContent = () => {
    switch (state.activeTab) {
      case 'inbox': return <InboxView />;
      case 'today': return <TodayView />;
      case 'habits': return <HabitsView />;
      case 'sleep': return <SleepView />;
      case 'chat': return <ChatView />;
      default: return <TodayView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-200 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm z-20">
        <div className="p-6 border-b border-slate-800/50">
          <h1 className="text-xl font-bold text-slate-100">Productivity</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = state.activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: item.id })}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings / Data Options */}
        <div className="p-4 border-t border-slate-800/50 space-y-2">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 text-sm font-medium transition-colors border border-slate-700/50"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export Data
          </button>

          <button
            onClick={handleImportClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 text-sm font-medium transition-colors border border-slate-700/50"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            Import Data
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header / Global Search */}
        <header className="h-20 flex items-center justify-center px-4 md:px-8 border-b border-slate-800/50 shrink-0 z-30 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search tasks or ask AI..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-sm"
              />
            </div>

            {/* Dropdown Results */}
            {showResults && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-2 max-h-96 overflow-y-auto">
                  {matchedTasks.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">Tasks</div>
                      {matchedTasks.map(t => (
                        <button
                          key={t.id}
                          onClick={() => navigateToTab('today')}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-700/50 flex items-center gap-3 text-slate-200 transition-colors"
                        >
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                          <span className="truncate">{t.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedHabits.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">Habits</div>
                      {matchedHabits.map(h => (
                        <button
                          key={h.id}
                          onClick={() => navigateToTab('habits')}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-700/50 flex items-center gap-3 text-slate-200 transition-colors"
                        >
                          <CalendarDays className="w-4 h-4 text-indigo-400" />
                          <span className="truncate">{h.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-700/50 mt-1 pt-1">
                    <button
                      onClick={handleAskAI}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-500/10 flex items-center gap-3 text-indigo-400 transition-colors font-medium"
                    >
                      <Bot className="w-4 h-4" />
                      <span className="truncate">Ask AI: "{searchQuery}"</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900">
          {renderContent()}
        </main>
      </div>

      {/* Mobile TabBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center z-50 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = state.activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: item.id })}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors rounded-lg mx-1 ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
}
