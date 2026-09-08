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
      <h1 className="text-3xl font-serif font-bold text-slate-100 mb-6">Sleep Tracker</h1>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-6">
          <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-6 uppercase flex items-center gap-2">
            <MoonStar className="w-4 h-4" />
            Log Sleep
          </h2>

          <form onSubmit={handleAddSleep} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 border border-slate-800 [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Hours Slept</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Quality (1-5)</label>
                <div className="flex gap-2 h-[46px]">
                  {[1, 2, 3, 4, 5].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q.toString())}
                      className={`flex-1 rounded-xl border font-medium transition-colors ${
                        quality === q.toString()
                          ? 'bg-amber-500 border-amber-500 text-slate-900'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
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
              className="w-full bg-amber-500 text-slate-900 font-bold rounded-xl px-4 py-3 hover:bg-amber-600 transition-colors shadow-lg mt-4"
            >
              Save Sleep Entry
            </button>
          </form>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-6 overflow-x-auto relative">
          <div className="flex items-center justify-between mb-8 min-w-[300px]">
            <h2 className="text-sm font-bold text-slate-500 tracking-wider uppercase flex items-center gap-2">
              <BedDouble className="w-4 h-4" />
              Sleep History
            </h2>
            <select
              value={timeSpanDays}
              onChange={(e) => setTimeSpanDays(parseInt(e.target.value))}
              className="bg-slate-950 text-sm text-slate-300 rounded-lg px-3 py-1.5 outline-none border border-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          <div className="min-w-fit">
            <div className="flex items-end justify-start gap-1 h-48 mt-4 pt-4 border-b border-slate-800 pb-2 relative"
                 style={{ minWidth: timeSpanDays > 30 ? '800px' : 'auto' }}>
              {/* Guide lines */}
              <div className="absolute top-0 left-0 w-full border-t border-slate-800/50">
                <span className="absolute -top-3 left-0 text-[10px] font-medium text-slate-500 bg-slate-900 pr-1 z-20">{maxHours}h</span>
              </div>
              <div className="absolute top-1/2 left-0 w-full border-t border-slate-800/50">
                <span className="absolute -top-3 left-0 text-[10px] font-medium text-slate-500 bg-slate-900 pr-1 z-20">{Math.round(maxHours/2)}h</span>
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
                      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-30 border border-slate-700">
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

                    <div className="w-full max-w-[40px] bg-slate-800/30 rounded-t flex items-end h-full">
                      <div
                        className="w-full bg-amber-500/80 hover:bg-amber-500 rounded-t transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    {/* Only show day label if span is short to avoid crowding */}
                    {timeSpanDays <= 30 && (
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isSameDay(day, today) ? 'text-amber-500' : 'text-slate-500'}`}>
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
