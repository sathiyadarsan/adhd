import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId, calculateStreak, getWeeklyProgress } from '../utils/helpers';
import type { Habit } from '../types';
import { format, subDays, eachDayOfInterval, isSameDay, startOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, setYear, getYear } from 'date-fns';
import { Plus, Flame, Trash2, Calendar as CalendarIcon, X, Target, ChevronLeft, ChevronRight } from 'lucide-react';

export function HabitsView() {
  const { state, dispatch } = useAppContext();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [goalType, setGoalType] = useState<'daily'|'weekly'>('daily');
  const [weeklyTarget, setWeeklyTarget] = useState(3);

  const [timeSpanDays, setTimeSpanDays] = useState(84);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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

  const handlePrevMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    setSelectedMonth(setYear(selectedMonth, year));
  };

  const handleDayClick = (day: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: format(day, 'yyyy-MM-dd') });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'today' });
  };

  const currentYear = getYear(today);
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="w-full max-w-6xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100">Habits & Calendar</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column: Habits List & Heatmap */}
        <div className="space-y-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-100 mb-6">Track Habits</h2>

            <div className="space-y-3">
              {state.habits.map(habit => (
                <HabitRow key={habit.id} habit={habit} />
              ))}
              {state.habits.length === 0 && (
                <div className="text-center py-10 text-slate-500 border border-dashed border-slate-700/50 rounded-xl bg-slate-800/30">
                  No habits yet
                  <br />
                  <span className="text-sm opacity-70">Tap the + button to build one.</span>
                </div>
              )}
            </div>
          </div>

          {state.habits.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 overflow-x-auto relative shadow-sm">
              <div className="flex items-center justify-between mb-6 min-w-[300px]">
                <h2 className="text-lg font-semibold text-slate-100">Activity Heatmap</h2>
                <select
                  value={timeSpanDays}
                  onChange={(e) => setTimeSpanDays(parseInt(e.target.value))}
                  className="bg-slate-800 text-sm text-slate-300 rounded-lg px-3 py-1.5 outline-none border border-slate-700/50 focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
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

                    const intensity = count === 0 ? 'bg-slate-800/80 border-slate-700/30' :
                                     count === 1 ? 'bg-indigo-500/40 border-indigo-500/50' :
                                     count === 2 ? 'bg-indigo-500/70 border-indigo-500/80' :
                                     'bg-indigo-500 border-indigo-400';

                    return (
                      <div
                        key={dateStr}
                        title={`${count} habits completed on ${format(day, 'MMM d, yyyy')}`}
                        className={`w-3.5 h-3.5 rounded-[3px] border transition-colors ${intensity} ${isSameDay(day, today) ? 'ring-2 ring-slate-400 ring-offset-1 ring-offset-slate-900 z-10' : ''}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-3 text-xs font-medium text-slate-500">
                  <span>{format(heatmapStart, 'MMM d')}</span>
                  <span>{format(today, 'MMM d')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Calendar for Tasks */}
        <div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                Calendar
              </h2>

              <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 rounded-lg p-1">
                <button onClick={handlePrevMonth} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-slate-200 font-medium text-sm px-2 min-w-[3.5rem] text-center">
                  {format(selectedMonth, 'MMM')}
                </div>
                <select
                  value={getYear(selectedMonth)}
                  onChange={handleYearChange}
                  className="bg-transparent text-slate-200 font-medium text-sm outline-none cursor-pointer hover:bg-slate-700 rounded-md transition-colors py-1 px-1 appearance-none text-center"
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y} className="bg-slate-800 text-slate-200">{y}</option>
                  ))}
                </select>
                <button onClick={handleNextMonth} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
              ))}

              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasTask = state.tasks.some(t => t.scheduledDate === dateStr);
                const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
                const isTodayStr = isSameDay(day, today);
                const isSelectedDateStr = state.selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-colors border ${
                      !isCurrentMonth
                        ? 'text-slate-600 bg-transparent border-transparent'
                        : 'text-slate-300 bg-slate-800/40 border-slate-700/30 hover:bg-slate-700 hover:border-slate-600'
                    } ${
                      isSelectedDateStr
                        ? 'bg-slate-700 border-slate-500 text-white shadow-sm ring-1 ring-slate-500 z-20'
                        : ''
                    } ${
                      isTodayStr && !isSelectedDateStr
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 z-10'
                        : ''
                    }`}
                  >
                    <span className={`text-sm ${isTodayStr || isSelectedDateStr ? 'font-bold' : 'font-medium'} z-10`}>{format(day, 'd')}</span>
                    {hasTask && (
                      <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isTodayStr || isSelectedDateStr ? 'bg-indigo-400' : 'bg-indigo-500/70'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action Button Overlay */}
      {isFabOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex flex-col justify-end p-4 pb-32 transition-all" onClick={() => setIsFabOpen(false)}>
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100">Create Habit</h3>
              <button type="button" onClick={() => setIsFabOpen(false)} className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHabit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Habit Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="e.g., Read 10 pages..."
                  className="w-full pl-4 pr-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Goal Type</label>
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="goalType" value="daily" checked={goalType === 'daily'} onChange={() => setGoalType('daily')} className="sr-only peer" />
                    <div className="bg-slate-900 text-slate-400 border border-slate-700/50 rounded-xl font-medium px-4 py-3 text-center peer-checked:bg-indigo-500 peer-checked:text-white peer-checked:border-indigo-500 transition-colors shadow-sm">
                      Daily
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input type="radio" name="goalType" value="weekly" checked={goalType === 'weekly'} onChange={() => setGoalType('weekly')} className="sr-only peer" />
                    <div className="bg-slate-900 text-slate-400 border border-slate-700/50 rounded-xl font-medium px-4 py-3 text-center peer-checked:bg-indigo-500 peer-checked:text-white peer-checked:border-indigo-500 transition-colors shadow-sm">
                      Weekly
                    </div>
                  </label>
                </div>
              </div>

              {goalType === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Target Per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(parseInt(e.target.value) || 1)}
                    className="w-full pl-4 pr-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!newHabitName.trim()}
                className="w-full bg-indigo-500 text-white font-medium rounded-xl px-4 py-3 hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
        className={`fixed bottom-20 md:bottom-12 right-6 md:right-12 z-50 w-14 h-14 bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all ${isFabOpen ? 'rotate-45' : ''}`}
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 group hover:border-slate-600 transition-colors gap-3 shadow-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={toggleToday}
          className={`w-8 h-8 rounded-lg border flex-shrink-0 flex items-center justify-center transition-colors ${
            isDoneToday
              ? 'bg-indigo-500 border-indigo-500 text-white'
              : 'bg-slate-900 border-slate-600 text-transparent hover:border-indigo-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <div className="flex flex-col min-w-0 truncate pr-2">
          <span className="text-slate-200 font-medium truncate">{habit.name}</span>
          {isWeekly && (
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mt-0.5">
              {progress}/{target} This Week
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto pl-11 sm:pl-0 shrink-0">

        {/* Badges */}
        <div className="flex gap-1.5">
          {streak >= 3 && (
            <div title="3 Streak: Hot" className="bg-slate-900 border border-slate-700 rounded-md p-1">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20" />
            </div>
          )}
          {isPro && (
            <div title="7 Streak: Pro" className="bg-slate-900 border border-slate-700 rounded-md p-1 text-teal-400">
              <Target className="w-4 h-4" />
            </div>
          )}
          {isMaster && (
            <div title="30 Streak: Master" className="bg-slate-900 border border-slate-700 rounded-md p-1 text-yellow-400 flex items-center justify-center">
              <span className="font-bold text-[14px] leading-none px-0.5">★</span>
            </div>
          )}
        </div>

        {/* Streak Count */}
        <div className={`flex items-baseline gap-1 px-2.5 py-1 rounded-md border text-sm font-semibold transition-colors ${
          streak > 0 ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-slate-900 border-slate-700/50 text-slate-500'
        }`}>
          <span>{streak}</span> <span className="text-[10px] uppercase">{isWeekly ? 'Wks' : 'Days'}</span>
        </div>

        <button
          onClick={removeHabit}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
