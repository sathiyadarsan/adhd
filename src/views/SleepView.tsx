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
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <h1 className="text-4xl text-white mb-8 border-b-4 border-white pb-4 inline-block pr-12">Sleep Tracker</h1>

      <div className="grid grid-cols-1 gap-12">
        <div className="bg-brand-card border-4 border-white shadow-brutal p-6">
          <h2 className="text-xl bg-white text-brand-bg inline-flex items-center gap-2 px-3 py-1 mb-8 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000]">
            <MoonStar className="w-5 h-5 stroke-[3]" />
            Log Sleep
          </h2>

          <form onSubmit={handleAddSleep} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="block font-black text-white uppercase tracking-wider mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="brutal-input w-full [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block font-black text-white uppercase tracking-wider mb-2">Hours Slept</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="brutal-input w-full"
                />
              </div>

              <div>
                <label className="block font-black text-white uppercase tracking-wider mb-2">Quality (1-5)</label>
                <div className="flex gap-2 h-[56px]">
                  {[1, 2, 3, 4, 5].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q.toString())}
                      className={`flex-1 border-4 font-black text-xl transition-all ${
                        quality === q.toString()
                          ? 'bg-brand-accent border-brand-bg text-brand-bg shadow-[2px_2px_0px_0px_#000] translate-x-[-2px] translate-y-[-2px]'
                          : 'bg-white border-white text-brand-bg hover:bg-brand-secondary hover:text-white'
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
              className="brutal-btn-accent w-full mt-4"
            >
              Save Sleep Entry
            </button>
          </form>
        </div>

        <div className="bg-brand-secondary border-4 border-white shadow-brutal p-6 overflow-x-auto relative">
          <div className="flex items-center justify-between mb-12 min-w-[300px]">
            <h2 className="text-xl bg-white text-brand-bg inline-flex items-center gap-2 px-3 py-1 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000]">
              <BedDouble className="w-5 h-5 stroke-[3]" />
              Sleep History
            </h2>
            <select
              value={timeSpanDays}
              onChange={(e) => setTimeSpanDays(parseInt(e.target.value))}
              className="bg-brand-bg text-white border-4 border-white font-bold px-3 py-2 outline-none shadow-brutal-sm cursor-pointer"
            >
              <option value={7}>LAST 7 DAYS</option>
              <option value={30}>LAST 30 DAYS</option>
              <option value={90}>LAST 90 DAYS</option>
            </select>
          </div>

          <div className="min-w-fit">
            <div className="flex items-end justify-start gap-2 h-64 mt-4 pt-4 border-b-4 border-white pb-2 relative"
                 style={{ minWidth: timeSpanDays > 30 ? '800px' : 'auto' }}>
              {/* Guide lines */}
              <div className="absolute top-0 left-0 w-full border-t-4 border-white border-dashed opacity-50 z-0">
                <span className="absolute -top-4 left-0 text-xs font-black text-brand-bg bg-white px-2 py-0.5 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000] z-20">{maxHours}H</span>
              </div>
              <div className="absolute top-1/2 left-0 w-full border-t-4 border-white border-dashed opacity-50 z-0">
                <span className="absolute -top-4 left-0 text-xs font-black text-brand-bg bg-white px-2 py-0.5 border-2 border-brand-bg shadow-[2px_2px_0px_0px_#000] z-20">{Math.round(maxHours/2)}H</span>
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
                      <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-bg text-sm text-white px-4 py-3 border-4 border-white shadow-brutal pointer-events-none whitespace-nowrap z-30">
                        <span className="font-black block mb-2 uppercase">{format(day, 'MMM d, yyyy')}</span>
                        <div className="font-bold">{h} HOURS <span className="opacity-50">|</span> Q: {entry.quality}/5</div>
                        <button
                          className="mt-3 bg-white text-brand-bg font-black px-2 py-1 w-full text-center border-2 border-transparent pointer-events-auto hover:border-brand-bg hover:bg-brand-accent transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: 'DELETE_SLEEP_ENTRY', payload: entry.id });
                          }}
                        >
                          DELETE
                        </button>
                      </div>
                    )}

                    <div className="w-full max-w-[60px] bg-brand-bg border-4 border-white border-b-0 flex items-end h-full">
                      <div
                        className="w-full bg-brand-accent hover:bg-white transition-colors border-t-4 border-brand-bg"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    {/* Only show day label if span is short to avoid crowding */}
                    {timeSpanDays <= 30 && (
                      <span className={`text-xs font-black uppercase tracking-widest mt-2 ${isSameDay(day, today) ? 'text-brand-bg bg-white px-1' : 'text-white'}`}>
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
