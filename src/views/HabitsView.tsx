import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId, calculateStreak } from '../utils/helpers';
import type { Habit } from '../types';
import { format, subDays, eachDayOfInterval, isSameDay, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Flame, Trash2, Calendar as CalendarIcon, X, Target } from 'lucide-react';

export function HabitsView() {
  const { state, dispatch } = useAppContext();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  // Settings for heatmap
  const [timeSpanDays, setTimeSpanDays] = useState(84); // defaults to roughly 12 weeks
  const [selectedMonth] = useState(new Date());

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: generateId(),
      name: newHabitName,
      createdAt: new Date().toISOString(),
      entries: {}
    };

    dispatch({ type: 'ADD_HABIT', payload: newHabit });
    setNewHabitName('');
    setIsFabOpen(false);
  };

  const today = new Date();

  // Heatmap: dynamic based on timeSpanDays, adjusted to start on Sunday if roughly aligning
  const heatmapStart = startOfWeek(subDays(today, timeSpanDays - 1));
  const heatmapDays = eachDayOfInterval({ start: heatmapStart, end: today });

  // Simple calendar grid for selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: monthEnd });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-24">
      <h1 className="text-3xl font-serif font-bold text-white mb-6">Habits & Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column: Habits List & Heatmap */}
        <div className="space-y-8">
          <div className="bg-brand-card rounded-2xl border border-brand-secondary shadow-lg p-6">
            <h2 className="text-sm font-bold text-white/50 tracking-wider mb-6 uppercase">Track Habits</h2>

            <div className="space-y-4">
              {state.habits.map(habit => (
                <HabitRow key={habit.id} habit={habit} />
              ))}
              {state.habits.length === 0 && (
                <div className="text-center py-8 text-white/50 border border-dashed border-brand-secondary rounded-xl bg-brand-card/50">
                  No habits yet
                </div>
              )}
            </div>
          </div>

          {/* Unified Leetcode-style Heatmap for all habits combined activity */}
          {state.habits.length > 0 && (
            <div className="bg-brand-card rounded-2xl border border-brand-secondary shadow-lg p-6 overflow-x-auto relative">
              <div className="flex items-center justify-between mb-6 min-w-[300px]">
                <h2 className="text-sm font-bold text-white/50 tracking-wider uppercase">Activity Heatmap</h2>
                <select
                  value={timeSpanDays}
                  onChange={(e) => setTimeSpanDays(parseInt(e.target.value))}
                  className="bg-brand-bg text-sm text-white/80 rounded-lg px-3 py-1.5 outline-none border border-brand-secondary focus:ring-2 focus:ring-brand-accent"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={84}>Last 90 Days</option>
                </select>
              </div>

              <div className="min-w-fit pr-4">
                <div className="grid grid-flow-col grid-rows-7 gap-1.5" style={{ gridAutoColumns: 'max-content' }}>
                  {heatmapDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = state.habits.filter(h => h.entries[dateStr]).length;

                    const intensity = count === 0 ? 'bg-brand-secondary/50' :
                                     count === 1 ? 'bg-brand-accent/40' :
                                     count === 2 ? 'bg-brand-accent/70' :
                                     'bg-brand-accent';

                    return (
                      <div
                        key={dateStr}
                        title={`${count} habits completed on ${format(day, 'MMM d, yyyy')}`}
                        className={`w-3.5 h-3.5 rounded-sm ${intensity} transition-colors ${isSameDay(day, today) ? 'ring-2 ring-slate-100 ring-offset-1 ring-offset-slate-900' : ''}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-3 text-xs font-medium text-white/50">
                  <span>{format(heatmapStart, 'MMM d')}</span>
                  <span>{format(today, 'MMM d')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Mini Calendar for Tasks */}
        <div>
          <div className="bg-brand-card rounded-2xl border border-brand-secondary shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-white/50 tracking-wider uppercase flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </h2>
              <span className="text-white font-medium">{format(selectedMonth, 'MMMM yyyy')}</span>
            </div>

            <div className="grid grid-cols-7 gap-px bg-brand-secondary rounded-xl overflow-hidden border border-brand-secondary">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="bg-brand-card py-2 text-center text-xs font-bold text-white/50 uppercase">{d}</div>
              ))}

              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasTask = state.tasks.some(t => t.scheduledDate === dateStr);
                const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
                const isTodayStr = isSameDay(day, today);

                return (
                  <div
                    key={dateStr}
                    className={`bg-brand-card aspect-square flex flex-col items-center justify-center relative transition-colors ${
                      !isCurrentMonth ? 'text-white/40 bg-brand-card/50' : 'text-white/80'
                    } ${isTodayStr ? 'bg-brand-accent text-slate-900 font-bold' : 'hover:bg-brand-secondary'}`}
                  >
                    <span className="text-sm z-10">{format(day, 'd')}</span>
                    {hasTask && (
                      <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isTodayStr ? 'bg-brand-card' : 'bg-brand-accent'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action Button (FAB) and Overlay */}
      {isFabOpen && (
        <div className="fixed inset-0 bg-brand-bg/80 z-40 flex flex-col justify-end p-4 pb-24" onClick={() => setIsFabOpen(false)}>
          <div
            className="bg-brand-card border border-brand-secondary rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl transform transition-transform"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white">Create New Habit</h3>
              <button onClick={() => setIsFabOpen(false)} className="text-white/50 hover:text-white/80 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wide mb-1">Habit Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="E.g., Read 10 pages..."
                  className="w-full bg-brand-bg text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-accent placeholder:text-white/40 border border-brand-secondary"
                />
              </div>

              <button
                type="submit"
                disabled={!newHabitName.trim()}
                className="w-full bg-brand-accent text-slate-900 font-bold rounded-xl px-4 py-3 hover:bg-brand-accent/80 transition-colors shadow-lg disabled:opacity-50"
              >
                Create Habit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsFabOpen(!isFabOpen)}
        className={`fixed bottom-20 md:bottom-12 right-6 md:right-12 z-50 w-14 h-14 bg-brand-accent text-slate-900 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${isFabOpen ? 'rotate-45' : ''}`}
      >
        <Plus className="w-6 h-6" />
      </button>

    </div>
  );
}

function HabitRow({ habit }: { habit: Habit }) {
  const { dispatch } = useAppContext();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isDoneToday = !!habit.entries[todayStr];
  const streak = calculateStreak(habit);

  const toggleToday = () => {
    dispatch({
      type: 'TOGGLE_HABIT_ENTRY',
      payload: { habitId: habit.id, date: todayStr, value: !isDoneToday }
    });
  };

  const removeHabit = () => {
    dispatch({ type: 'DELETE_HABIT', payload: habit.id });
  };

  // Determine milestone badges
  const isPro = streak >= 7;
  const isMaster = streak >= 30;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-brand-secondary/30 p-4 rounded-xl border border-brand-secondary/50/50 group hover:border-slate-600 transition-colors gap-4">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleToday}
          className={`w-8 h-8 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            isDoneToday
              ? 'bg-brand-accent border-brand-accent text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'border-slate-600 text-transparent hover:border-brand-accent'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <span className="text-white/90 font-medium truncate">{habit.name}</span>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto pl-12 sm:pl-0">

        {/* Badges */}
        <div className="flex gap-1.5">
          {streak >= 3 && (
            <div title="3-Day Streak: Hot" className="bg-orange-500/10 text-orange-400 p-1.5 rounded-full border border-orange-500/20">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
            </div>
          )}
          {isPro && (
            <div title="7-Day Streak: Pro" className="bg-blue-500/10 text-blue-400 p-1.5 rounded-full border border-blue-500/20">
              <Target className="w-3.5 h-3.5" />
            </div>
          )}
          {isMaster && (
            <div title="30-Day Streak: Master" className="bg-brand-accent/10 text-brand-accent p-1.5 rounded-full border border-brand-accent/20">
              <span className="font-bold text-[10px] px-1">★</span>
            </div>
          )}
        </div>

        {/* Streak Count */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
          streak > 0 ? 'bg-brand-secondary/70 text-white' : 'bg-brand-secondary text-white/50'
        }`}>
          {streak} <span className="text-[10px] uppercase font-normal opacity-70">Days</span>
        </div>

        <button
          onClick={removeHabit}
          className="opacity-0 group-hover:opacity-100 p-2 text-white/50 hover:text-red-400 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
