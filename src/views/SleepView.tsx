import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import type { SleepEntry } from '../types';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { BedDouble, MoonStar } from 'lucide-react';

export function SleepView() {
  const { state, dispatch } = useAppContext();
  const [hours, setHours] = useState('8');
  const [quality, setQuality] = useState('3');

  // default to yesterday since we usually log sleep for the previous night
  const [date, setDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));

  // Setting for chart
  const [timeSpanDays, setTimeSpanDays] = useState(7);

  const handleAddSleep = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours)) return;

    const newEntry: SleepEntry = {
      id: generateId(),
      date,
      hoursSlept: parsedHours,
      quality: parseInt(quality, 10)
    };

    dispatch({ type: 'ADD_SLEEP_ENTRY', payload: newEntry });
  };

  // Prepare chart data based on span
  const today = new Date();
  const dateInterval = eachDayOfInterval({ start: subDays(today, timeSpanDays - 1), end: today });

  // max hours for scaling the chart
  const maxHours = Math.max(8, ...state.sleepEntries.map(s => s.hoursSlept));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-serif font-bold text-white mb-6">Sleep Tracker</h1>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-brand-card rounded-2xl border border-brand-secondary shadow-lg p-6">
          <h2 className="text-sm font-bold text-white/50 tracking-wider mb-6 uppercase flex items-center gap-2">
            <MoonStar className="w-4 h-4" />
            Log Sleep
          </h2>

          <form onSubmit={handleAddSleep} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-brand-bg text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-accent border border-brand-secondary [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">Hours Slept</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-brand-bg text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-accent border border-brand-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">Quality (1-5)</label>
                <div className="flex gap-2 h-[46px]">
                  {[1, 2, 3, 4, 5].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q.toString())}
                      className={`flex-1 rounded-xl border font-medium transition-colors ${
                        quality === q.toString()
                          ? 'bg-brand-accent border-brand-accent text-slate-900'
                          : 'bg-brand-bg border-brand-secondary text-white/60 hover:border-slate-600'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-accent text-slate-900 font-bold rounded-xl px-4 py-3 hover:bg-brand-accent/80 transition-colors shadow-lg mt-4"
            >
              Save Sleep Entry
            </button>
          </form>
        </div>

        <div className="bg-brand-card rounded-2xl border border-brand-secondary shadow-lg p-6 overflow-x-auto relative">
          <div className="flex items-center justify-between mb-8 min-w-[300px]">
            <h2 className="text-sm font-bold text-white/50 tracking-wider uppercase flex items-center gap-2">
              <BedDouble className="w-4 h-4" />
              Sleep History
            </h2>
            <select
              value={timeSpanDays}
              onChange={(e) => setTimeSpanDays(parseInt(e.target.value))}
              className="bg-brand-bg text-sm text-white/80 rounded-lg px-3 py-1.5 outline-none border border-brand-secondary focus:ring-2 focus:ring-brand-accent"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          <div className="min-w-fit">
            <div className="flex items-end justify-start gap-1 h-48 mt-4 pt-4 border-b border-brand-secondary pb-2 relative"
                 style={{ minWidth: timeSpanDays > 30 ? '800px' : 'auto' }}>
              {/* Guide lines */}
              <div className="absolute top-0 left-0 w-full border-t border-brand-secondary/50">
                <span className="absolute -top-3 left-0 text-[10px] font-medium text-white/50 bg-brand-card pr-1 z-20">{maxHours}h</span>
              </div>
              <div className="absolute top-1/2 left-0 w-full border-t border-brand-secondary/50">
                <span className="absolute -top-3 left-0 text-[10px] font-medium text-white/50 bg-brand-card pr-1 z-20">{Math.round(maxHours/2)}h</span>
              </div>

              {dateInterval.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const entry = state.sleepEntries.find(s => s.date === dateStr);

                const h = entry ? entry.hoursSlept : 0;
                const heightPercent = (h / maxHours) * 100;

                return (
                  <div key={dateStr} className="flex flex-col items-center flex-1 gap-2 z-10 group relative h-full">
                    {/* Tooltip */}
                    {entry && (
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-secondary text-xs text-white/90 px-3 py-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-30 border border-brand-secondary/50">
                        <span className="font-bold block mb-1">{format(day, 'MMM d, yyyy')}</span>
                        {h}h (Quality: {entry.quality}/5)
                        <button
                          className="mt-2 text-red-400 pointer-events-auto hover:underline block w-full text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: 'DELETE_SLEEP_ENTRY', payload: entry.id });
                          }}
                        >
                          Delete Entry
                        </button>
                      </div>
                    )}

                    <div className="w-full max-w-[40px] bg-brand-secondary/30 rounded-t flex items-end h-full">
                      <div
                        className="w-full bg-brand-accent/80 hover:bg-brand-accent rounded-t transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    {/* Only show day label if span is short to avoid crowding */}
                    {timeSpanDays <= 30 && (
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isSameDay(day, today) ? 'text-brand-accent' : 'text-white/50'}`}>
                        {timeSpanDays <= 7 ? format(day, 'EEE') : format(day, 'd')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
