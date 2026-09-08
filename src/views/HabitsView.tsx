import { useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { getTodayDateString, cn } from '../utils/helpers';
import { calculateStreak } from '../utils/streaks';
import type { Habit } from '../types';
import { Plus, Check, Flame } from 'lucide-react';

export function HabitsView() {
  const { habits, addHabit, removeHabit, toggleHabitEntry } = useHabits();
  const [newHabit, setNewHabit] = useState('');
  const today = getTodayDateString();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;

    const habit: Habit = {
      id: crypto.randomUUID(),
      name: newHabit.trim(),
      createdAt: new Date().toISOString(),
      entries: {},
    };

    addHabit(habit);
    setNewHabit('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="New habit..."
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 text-sm"
        />
        <button
          type="submit"
          disabled={!newHabit.trim()}
          className="bg-indigo-600 text-white p-2.5 rounded-xl disabled:opacity-50"
        >
          <Plus size={18} />
        </button>
      </form>

      <div className="space-y-4">
        {habits.map((habit) => {
          const isDoneToday = !!habit.entries[today];
          const streak = calculateStreak(habit, today);

          let badgeColor = 'text-gray-400 bg-gray-100';
          if (streak >= 30) badgeColor = 'text-yellow-600 bg-yellow-100';
          else if (streak >= 7) badgeColor = 'text-orange-600 bg-orange-100';
          else if (streak >= 3) badgeColor = 'text-red-500 bg-red-100';

          return (
            <div key={habit.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{habit.name}</h3>
                {streak > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1", badgeColor)}>
                      <Flame size={12} />
                      {streak} Day Streak
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleHabitEntry(habit.id, today, !isDoneToday)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isDoneToday
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  )}
                >
                  <Check size={20} strokeWidth={isDoneToday ? 3 : 2} />
                </button>
                <button
                  onClick={() => removeHabit(habit.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        {habits.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">
            No habits yet. Add one above!
          </div>
        )}
      </div>
    </div>
  );
}
