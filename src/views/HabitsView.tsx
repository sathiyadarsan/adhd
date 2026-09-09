import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId, calculateStreak, getWeeklyProgress } from '../utils/helpers';
import type { Habit } from '../types';
import { format, subDays, eachDayOfInterval, isSameDay, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Flame, Trash2, Calendar as CalendarIcon, X, Target } from 'lucide-react';

export function HabitsView() {
  const { state, dispatch } = useAppContext();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [goalType, setGoalType] = useState<'daily'|'weekly'>('daily');
  const [weeklyTarget, setWeeklyTarget] = useState(3);

  const [timeSpanDays, setTimeSpanDays] = useState(84);
  const [selectedMonth] = useState(new Date());

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: generateId(),
      name: newHabitName,
      createdAt: new Date().toISOString(),
      entries: {},
      goalType,
      weeklyTarget: goalType === 'weekly' ? weeklyTarget : undefined,
    };

    dispatch({ type: 'ADD_HABIT', payload: newHabit });
    setNewHabitName('');
    setIsFabOpen(false);
  };

  const today = new Date();

  const heatmapStart = startOfWeek(subDays(today, timeSpanDays - 1));
  const heatmapDays = eachDayOfInterval({ start: heatmapStart, end: today });

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: monthEnd });

  return (
    <div className="w-full max-w-6xl mx-auto pb-24">
      <h1 className="text-4xl text-white mb-8 border-b-4 border-white pb-4 inline-block pr-12">Habits & Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Left Column: Habits List & Heatmap */}
        <div className="space-y-12">
          <div className="bg-brand-secondary border-4 border-white shadow-brutal p-6">
            <h2 className="text-xl bg-white text-brand-bg inline-block px-3 py-1 mb-6 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000]">Track Habits</h2>

            <div className="space-y-4">
              {state.habits.map(habit => (
                <HabitRow key={habit.id} habit={habit} />
              ))}
              {state.habits.length === 0 && (
                <div className="text-center py-12 text-white border-4 border-dashed border-white bg-brand-bg font-bold tracking-widest uppercase">
                  No habits yet
                </div>
              )}
            </div>
          </div>

          {state.habits.length > 0 && (
            <div className="bg-brand-card border-4 border-white shadow-brutal p-6 overflow-x-auto relative">
              <div className="flex items-center justify-between mb-6 min-w-[300px]">
                <h2 className="text-xl bg-white text-brand-bg inline-block px-3 py-1 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000]">Activity Heatmap</h2>
                <select
                  value={timeSpanDays}
                  onChange={(e) => setTimeSpanDays(parseInt(e.target.value))}
                  className="bg-brand-bg text-white border-4 border-white font-bold px-3 py-2 outline-none shadow-sm cursor-pointer"
                >
                  <option value={7}>LAST 7 DAYS</option>
                  <option value={30}>LAST 30 DAYS</option>
                  <option value={84}>LAST 90 DAYS</option>
                </select>
              </div>

              <div className="min-w-fit pr-4">
                <div className="grid grid-flow-col grid-rows-7 gap-2" style={{ gridAutoColumns: 'max-content' }}>
                  {heatmapDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const count = state.habits.filter(h => h.entries[dateStr]).length;

                    const intensity = count === 0 ? 'bg-brand-bg/50 border-white/20' :
                                     count === 1 ? 'bg-brand-accent/40 border-brand-accent' :
                                     count === 2 ? 'bg-brand-accent/70 border-brand-accent' :
                                     'bg-brand-accent border-white';

                    return (
                      <div
                        key={dateStr}
                        title={`${count} habits completed on ${format(day, 'MMM d, yyyy')}`}
                        className={`w-4 h-4 border-2 transition-colors ${intensity} ${isSameDay(day, today) ? 'scale-125 z-10 bg-white border-brand-bg shadow-[2px_2px_0px_0px_#f49301]' : ''}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4 text-sm font-black text-white uppercase tracking-wider">
                  <span>{format(heatmapStart, 'MMM d')}</span>
                  <span>{format(today, 'MMM d')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Mini Calendar for Tasks */}
        <div>
          <div className="bg-brand-card border-4 border-white shadow-brutal p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl bg-white text-brand-bg inline-flex items-center gap-2 px-3 py-1 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000]">
                <CalendarIcon className="w-5 h-5 stroke-[3]" />
                Calendar
              </h2>
              <span className="text-white font-black uppercase tracking-wider bg-brand-bg border-4 border-white px-3 py-1 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">{format(selectedMonth, 'MMMM yyyy')}</span>
            </div>

            <div className="grid grid-cols-7 gap-2 bg-brand-bg p-2 border-4 border-white shadow-brutal-sm">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="py-2 text-center text-sm font-black text-white uppercase">{d}</div>
              ))}

              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasTask = state.tasks.some(t => t.scheduledDate === dateStr);
                const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
                const isTodayStr = isSameDay(day, today);

                return (
                  <div
                    key={dateStr}
                    className={`aspect-square border-4 flex flex-col items-center justify-center relative transition-colors ${
                      !isCurrentMonth ? 'text-white/30 border-transparent bg-transparent' : 'text-brand-bg bg-white border-white'
                    } ${isTodayStr ? 'bg-brand-accent border-brand-bg text-brand-bg shadow-[2px_2px_0px_0px_#000] scale-110 z-10' : (isCurrentMonth ? 'hover:bg-brand-secondary hover:text-white' : '')}`}
                  >
                    <span className="text-lg font-black z-10">{format(day, 'd')}</span>
                    {hasTask && (
                      <div className={`absolute bottom-1 w-2 h-2 border-2 border-brand-bg ${isTodayStr ? 'bg-white' : 'bg-brand-accent'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action Button Overlay */}
      {isFabOpen && (
        <div className="fixed inset-0 bg-brand-bg/90 z-40 flex flex-col justify-end p-4 pb-32" onClick={() => setIsFabOpen(false)}>
          <div
            className="bg-brand-secondary border-4 border-white p-8 w-full max-w-md mx-auto shadow-brutal transform transition-transform translate-x-[-4px] translate-y-[-4px]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8 border-b-4 border-white pb-4">
              <h3 className="text-2xl text-white font-black uppercase">CREATE HABIT</h3>
              <button type="button" onClick={() => setIsFabOpen(false)} className="text-white hover:text-brand-accent transition-colors">
                <X className="w-8 h-8 stroke-[3]" />
              </button>
            </div>

            <form onSubmit={handleAddHabit} className="space-y-6">
              <div>
                <label className="block font-black text-white uppercase tracking-wider mb-2">Habit Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="E.g., Read 10 pages..."
                  className="brutal-input w-full"
                />
              </div>

              <div>
                <label className="block font-black text-white uppercase tracking-wider mb-2">Goal Type</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="goalType" value="daily" checked={goalType === 'daily'} onChange={() => setGoalType('daily')} className="sr-only peer" />
                    <div className="bg-brand-bg text-white border-4 border-white font-black uppercase tracking-wider px-4 py-3 text-center peer-checked:bg-white peer-checked:text-brand-bg transition-colors shadow-brutal peer-checked:translate-x-[2px] peer-checked:translate-y-[2px] peer-checked:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                      Daily
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="goalType" value="weekly" checked={goalType === 'weekly'} onChange={() => setGoalType('weekly')} className="sr-only peer" />
                    <div className="bg-brand-bg text-white border-4 border-white font-black uppercase tracking-wider px-4 py-3 text-center peer-checked:bg-white peer-checked:text-brand-bg transition-colors shadow-brutal peer-checked:translate-x-[2px] peer-checked:translate-y-[2px] peer-checked:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                      Weekly
                    </div>
                  </label>
                </div>
              </div>

              {goalType === 'weekly' && (
                <div>
                  <label className="block font-black text-white uppercase tracking-wider mb-2">Target Per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(parseInt(e.target.value) || 1)}
                    className="brutal-input w-full"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!newHabitName.trim()}
                className="brutal-btn-accent w-full disabled:opacity-50 disabled:pointer-events-none mt-4"
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
        className={`fixed bottom-24 md:bottom-12 right-6 md:right-12 z-50 w-16 h-16 bg-brand-accent text-brand-bg border-4 border-white shadow-brutal flex items-center justify-center hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all ${isFabOpen ? 'rotate-45' : ''}`}
      >
        <Plus className="w-8 h-8 stroke-[4]" />
      </button>

    </div>
  );
}

function HabitRow({ habit }: { habit: Habit }) {
  const { dispatch } = useAppContext();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isDoneToday = !!habit.entries[todayStr];
  const streak = calculateStreak(habit);
  const isWeekly = habit.goalType === 'weekly';
  const progress = isWeekly ? getWeeklyProgress(habit) : 0;
  const target = habit.weeklyTarget || 0;

  const toggleToday = () => {
    dispatch({
      type: 'TOGGLE_HABIT_ENTRY',
      payload: { habitId: habit.id, date: todayStr, value: !isDoneToday }
    });
  };

  const removeHabit = () => {
    dispatch({ type: 'DELETE_HABIT', payload: habit.id });
  };

  const isPro = streak >= 7;
  const isMaster = streak >= 30;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-brand-bg p-4 border-4 border-white group transition-all shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] gap-4">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleToday}
          className={`w-10 h-10 border-4 flex-shrink-0 flex items-center justify-center transition-all ${
            isDoneToday
              ? 'bg-brand-accent border-white text-brand-bg shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] translate-x-[-2px] translate-y-[-2px]'
              : 'bg-white border-white text-transparent hover:bg-brand-accent hover:text-brand-bg'
          }`}
        >
          <svg className="w-7 h-7 stroke-[4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <div className="flex flex-col truncate">
          <span className="text-white font-bold text-lg uppercase tracking-wider truncate">{habit.name}</span>
          {isWeekly && (
            <span className="text-xs font-black text-brand-accent uppercase tracking-widest mt-0.5">
              {progress}/{target} This Week
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 self-end sm:self-auto pl-14 sm:pl-0">

        {/* Badges */}
        <div className="flex gap-2">
          {streak >= 3 && (
            <div title="3 Streak: Hot" className="bg-white border-4 border-brand-accent p-1.5 shadow-brutal-sm">
              <Flame className="w-5 h-5 fill-brand-accent text-brand-accent" />
            </div>
          )}
          {isPro && (
            <div title="7 Streak: Pro" className="bg-brand-accent border-4 border-white p-1.5 shadow-brutal-sm text-brand-bg">
              <Target className="w-5 h-5 stroke-[4]" />
            </div>
          )}
          {isMaster && (
            <div title="30 Streak: Master" className="bg-brand-bg border-4 border-brand-accent p-1.5 shadow-[2px_2px_0px_0px_#f49301] text-brand-accent flex items-center justify-center">
              <span className="font-black text-lg leading-none px-1">★</span>
            </div>
          )}
        </div>

        {/* Streak Count */}
        <div className={`flex items-center gap-2 px-3 py-2 border-4 text-sm font-black uppercase tracking-wider ${
          streak > 0 ? 'bg-white border-brand-bg text-brand-bg' : 'bg-brand-bg border-white/30 text-white/50'
        }`}>
          <span className="text-xl">{streak}</span> <span>{isWeekly ? 'Wks' : 'Days'}</span>
        </div>

        <button
          onClick={removeHabit}
          className="opacity-0 group-hover:opacity-100 p-2 text-white hover:bg-white hover:text-brand-bg border-2 border-transparent hover:border-brand-bg transition-all"
        >
          <Trash2 className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
