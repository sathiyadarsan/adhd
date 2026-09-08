import type { Habit } from '../types';
import { format, subDays, parseISO } from 'date-fns';

export function calculateStreak(habit: Habit, currentDateString: string = format(new Date(), 'yyyy-MM-dd')): number {
  let streak = 0;
  let date = parseISO(currentDateString);

  // Check today first
  const todayStr = format(date, 'yyyy-MM-dd');
  const todayDone = habit.entries[todayStr];

  if (todayDone) {
    streak++;
  }

  // If today isn't done, but yesterday is, the streak is still alive, just starts from yesterday
  // If neither today nor yesterday is done, streak is 0
  date = subDays(date, 1);
  let checkStr = format(date, 'yyyy-MM-dd');

  if (!todayDone && !habit.entries[checkStr]) {
    return 0;
  }

  // Continue counting backwards
  while (habit.entries[checkStr]) {
    streak++;
    date = subDays(date, 1);
    checkStr = format(date, 'yyyy-MM-dd');
  }

  return streak;
}
