import { useState } from 'react';
import { useSleep } from '../hooks/useSleep';
import { getTodayDateString, cn } from '../utils/helpers';
import type { SleepEntry } from '../types';
import { format, subDays, parseISO } from 'date-fns';

export function SleepView() {
  const { sleepEntries, addSleepEntry } = useSleep();
  const today = getTodayDateString();
  const [hours, setHours] = useState<string>('8');
  const [quality, setQuality] = useState<number>(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: SleepEntry = {
      id: crypto.randomUUID(),
      date: today,
      hoursSlept: parseFloat(hours),
      quality,
    };
    addSleepEntry(entry);
  };

  const todayEntry = sleepEntries.find(e => e.date === today);

  // Generate last 7 days for the chart
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    return format(d, 'yyyy-MM-dd');
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Log Sleep</h2>
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours Slept</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quality (1-5)</label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-sm font-medium transition-colors",
                    quality === q
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-medium py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            {todayEntry ? 'Update Entry' : 'Save Entry'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Last 7 Days</h2>
        <div className="flex items-end justify-between h-48 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          {last7Days.map((dateStr) => {
            const entry = sleepEntries.find(e => e.date === dateStr);
            const val = entry?.hoursSlept || 0;
            const heightPercent = Math.min((val / 12) * 100, 100); // normalize against 12 hours max

            return (
              <div key={dateStr} className="flex flex-col items-center flex-1 gap-2">
                <div className="w-full relative h-32 flex items-end justify-center group">
                  <div
                    className="w-full max-w-[24px] bg-indigo-200 rounded-t-sm transition-all group-hover:bg-indigo-400"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {val > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {val}h
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 font-medium">
                  {format(parseISO(dateStr), 'EEEE').substring(0, 1)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
