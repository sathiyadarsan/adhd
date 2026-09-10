import { useState, useRef, useEffect } from 'react';
import { Search, CalendarDays, CheckSquare, BedDouble, MessageSquare, Bot, Inbox, Download, Upload, Palette, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { TabName } from '../../context/AppContext';
import type { ThemePreset } from '../../types';

import { TodayView } from '../../views/TodayView';
import { HabitsView } from '../../views/HabitsView';
import { SleepView } from '../../views/SleepView';
import { ChatView } from '../../views/ChatView';
import { InboxView } from '../../views/InboxView';

export function PageShell() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
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
    <div className="flex h-screen w-full bg-theme-bg text-slate-200 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-theme-bg/50 backdrop-blur-sm z-20">
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
                    ? 'bg-theme-accent/10 text-theme-accent'
                    : 'text-slate-400 hover:bg-theme-card hover:text-slate-200'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-theme-accent' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings / Data Options */}
        <div className="p-4 border-t border-slate-800/50 space-y-2">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-theme-card text-slate-300 hover:bg-theme-border hover:text-slate-100 text-sm font-medium transition-colors border border-theme-border/50"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export Data
          </button>

          <button
            onClick={handleImportClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-theme-card text-slate-300 hover:bg-theme-border hover:text-slate-100 text-sm font-medium transition-colors border border-theme-border/50"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            Import Data
          </button>

          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-theme-card text-slate-300 hover:bg-theme-border hover:text-slate-100 text-sm font-medium transition-colors border border-theme-border/50"
          >
            <Palette className="w-4 h-4 text-slate-400" />
            Theme Options
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

      {isThemeModalOpen && (
        <ThemeModal onClose={() => setIsThemeModalOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header / Global Search */}
        <header className="h-20 flex items-center justify-center px-4 md:px-8 border-b border-slate-800/50 shrink-0 z-30 bg-theme-bg/50 backdrop-blur-sm">
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
                className="w-full pl-12 pr-4 py-3 bg-theme-card border border-theme-border/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-theme-accent/30 transition-all shadow-sm"
              />
            </div>

            {/* Dropdown Results */}
            {showResults && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-theme-card border border-theme-border rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-2 max-h-96 overflow-y-auto">
                  {matchedTasks.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase">Tasks</div>
                      {matchedTasks.map(t => (
                        <button
                          key={t.id}
                          onClick={() => navigateToTab('today')}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-theme-border/50 flex items-center gap-3 text-slate-200 transition-colors"
                        >
                          <CheckSquare className="w-4 h-4 text-theme-accent" />
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
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-theme-border/50 flex items-center gap-3 text-slate-200 transition-colors"
                        >
                          <CalendarDays className="w-4 h-4 text-theme-accent" />
                          <span className="truncate">{h.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-theme-border/50 mt-1 pt-1">
                    <button
                      onClick={handleAskAI}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-theme-accent/10 flex items-center gap-3 text-theme-accent transition-colors font-medium"
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
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-theme-bg">
          {renderContent()}
        </main>
      </div>

      {/* Mobile TabBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-theme-bg/90 backdrop-blur-md border-t border-slate-800 flex items-center z-50 px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = state.activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: item.id })}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors rounded-lg mx-1 ${
                isActive ? 'text-theme-accent' : 'text-slate-500 hover:text-slate-300 hover:bg-theme-card/50'
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

// Theme Modal Component
function ThemeModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useAppContext();

  const presets: { id: ThemePreset; name: string; colors: { bg: string, card: string, border: string, accent: string, secondary: string } }[] = [
    {
      id: 'editor-dark',
      name: 'Editor Dark',
      colors: { bg: '15 23 42', card: '30 41 59', border: '51 65 85', accent: '99 102 241', secondary: '45 212 191' }
    },
    {
      id: 'warm-dark',
      name: 'Warm Dark',
      colors: { bg: '28 25 23', card: '41 37 36', border: '68 64 60', accent: '249 115 22', secondary: '234 179 8' }
    },
    {
      id: 'cool-gray',
      name: 'Cool Gray',
      colors: { bg: '39 39 42', card: '63 63 70', border: '82 82 91', accent: '56 189 248', secondary: '167 139 250' }
    }
  ];

  const handleSelectPreset = (presetId: ThemePreset) => {
    dispatch({ type: 'SET_THEME', payload: { preset: presetId } });
  };

  const isCustom = state.theme.preset === 'custom';
  const customColors = state.theme.customColors || presets[0].colors;

  const handleCustomColorChange = (key: keyof typeof customColors, hex: string) => {
    // Basic hex to rgb converter (ignores alpha, assumes #RRGGBB)
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    const rgb = `${r} ${g} ${b}`;

    dispatch({
      type: 'SET_THEME',
      payload: {
        preset: 'custom',
        customColors: {
          ...customColors,
          [key]: rgb
        }
      }
    });
  };

  const rgbToHex = (rgbStr: string) => {
    const parts = rgbStr.split(' ');
    if (parts.length !== 3) return '#000000';
    const r = parseInt(parts[0]).toString(16).padStart(2, '0');
    const g = parseInt(parts[1]).toString(16).padStart(2, '0');
    const b = parseInt(parts[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-theme-card border border-theme-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-theme-border/50 shrink-0">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Palette className="w-5 h-5 text-theme-accent" />
            Theme Options
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-theme-border/50 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Presets</h3>
            <div className="space-y-3">
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    state.theme.preset === p.id
                      ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent/50'
                      : 'border-theme-border/50 hover:border-theme-border bg-theme-bg/50'
                  }`}
                >
                  <span className="font-medium text-slate-200">{p.name}</span>
                  <div className="flex gap-1.5">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `rgb(${p.colors.bg})` }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `rgb(${p.colors.card})` }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `rgb(${p.colors.accent})` }} />
                  </div>
                </button>
              ))}

              <button
                onClick={() => dispatch({ type: 'SET_THEME', payload: { preset: 'custom', customColors: state.theme.customColors || presets[0].colors } })}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isCustom
                    ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent/50'
                    : 'border-theme-border/50 hover:border-theme-border bg-theme-bg/50'
                }`}
              >
                <span className="font-medium text-slate-200">Custom</span>
              </button>
            </div>
          </div>

          {isCustom && (
            <div className="pt-4 border-t border-theme-border/50">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Custom Colors</h3>
              <div className="space-y-4">
                {[
                  { key: 'bg', label: 'Background' },
                  { key: 'card', label: 'Card / Surface' },
                  { key: 'border', label: 'Borders' },
                  { key: 'accent', label: 'Primary Accent' },
                  { key: 'secondary', label: 'Secondary Accent' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">{label}</label>
                    <input
                      type="color"
                      value={rgbToHex(customColors[key as keyof typeof customColors])}
                      onChange={(e) => handleCustomColorChange(key as keyof typeof customColors, e.target.value)}
                      className="w-10 h-10 p-0 border-0 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
