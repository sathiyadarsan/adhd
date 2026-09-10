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

  const [date, setDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
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

  const today = new Date();
  const dateInterval = eachDayOfInterval({ start: subDays(today, timeSpanDays - 1), end: today });

  const maxHours = Math.max(8, ...state.sleepEntries.map(s => s.hoursSlept));

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100">Sleep Tracker</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-theme-card/50 backdrop-blur-sm border border-theme-border/50 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-100 mb-6 flex items-center gap-2">
            <MoonStar className="w-5 h-5 text-theme-accent" />
            Log Sleep
          </h2>

          <form onSubmit={handleAddSleep} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-theme-bg border border-theme-border/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/50 transition-shadow [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Hours Slept</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full pl-4 pr-4 py-3 bg-theme-bg border border-theme-border/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-theme-accent/50 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Quality (1-5)</label>
                <div className="flex gap-2 h-[46px]">
                  {[1, 2, 3, 4, 5].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q.toString())}
                      className={`flex-1 rounded-xl font-medium transition-colors border ${
                        quality === q.toString()
                          ? 'bg-theme-accent border-theme-accent text-white'
                          : 'bg-theme-bg border-theme-border/50 text-slate-400 hover:bg-theme-card'
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
              className="w-full bg-theme-accent text-white font-medium rounded-xl px-4 py-3 hover:bg-theme-accent transition-colors shadow-sm mt-2"
            >
              Save Sleep Entry
            </button>
          </form>
        </div>

        <div className="bg-theme-card/50 backdrop-blur-sm border border-theme-border/50 rounded-2xl p-6 overflow-x-auto relative shadow-sm">
          <div className="flex items-center justify-between mb-8 min-w-[300px]">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-theme-accent" />
              Sleep History
            </h2>
            <select
              value={timeSpanDays}
              onChange={(e) => setTimeSpanDays(parseInt(e.target.value))}
              className="bg-theme-card text-sm text-slate-300 rounded-lg px-3 py-1.5 outline-none border border-theme-border/50 focus:ring-2 focus:ring-theme-accent/50 cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          <div className="min-w-fit">
            <div className="flex items-end justify-start gap-1.5 h-64 mt-4 pt-4 border-b border-theme-border pb-2 relative"
                 style={{ minWidth: timeSpanDays > 30 ? '800px' : 'auto' }}>
              {/* Guide lines */}
              <div className="absolute top-0 left-0 w-full border-t border-theme-border/50 border-dashed z-0">
                <span className="absolute -top-3 left-0 text-[10px] font-medium text-slate-500 bg-theme-bg px-1 rounded z-20">{maxHours}h</span>
              </div>
              <div className="absolute top-1/2 left-0 w-full border-t border-theme-border/50 border-dashed z-0">
                <span className="absolute -top-3 left-0 text-[10px] font-medium text-slate-500 bg-theme-bg px-1 rounded z-20">{Math.round(maxHours/2)}h</span>
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
                      <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-theme-card text-xs text-slate-200 px-3 py-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-30 border border-theme-border">
                        <span className="font-semibold block mb-1">{format(day, 'MMM d, yyyy')}</span>
                        <div className="font-medium text-slate-300">{h} hours <span className="opacity-50 mx-1">|</span> Quality: {entry.quality}/5</div>
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

                    <div className="w-full max-w-[40px] bg-theme-bg/50 rounded-t-md flex items-end h-full">
                      <div
                        className="w-full bg-theme-accent/80 hover:bg-theme-accent/80 rounded-t-md transition-colors"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    {/* Only show day label if span is short to avoid crowding */}
                    {timeSpanDays <= 30 && (
                      <span className={`text-[10px] uppercase font-medium tracking-wider mt-1 ${isSameDay(day, today) ? 'text-theme-accent font-bold' : 'text-slate-500'}`}>
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
