import type { Habit } from '../types';
import { differenceInDays, parseISO, isToday, isYesterday } from 'date-fns';

export function calculateStreak(habit: Habit): number {
  if (!habit.entries || Object.keys(habit.entries).length === 0) {
    return 0;
  }

  // Get all dates where the habit was completed
  const completedDates = Object.entries(habit.entries)
    .filter(([_, completed]) => completed)
    .map(([dateString]) => parseISO(dateString))
    .sort((a, b) => b.getTime() - a.getTime()); // Sort newest first

  if (completedDates.length === 0) {
    return 0;
  }

  // The streak must include either today or yesterday to be active
  const mostRecent = completedDates[0];
  if (!isToday(mostRecent) && !isYesterday(mostRecent)) {
    return 0;
  }

  let streak = 1;
  let currentDateToCompare = mostRecent;

  for (let i = 1; i < completedDates.length; i++) {
    const nextDate = completedDates[i];
    const diff = differenceInDays(currentDateToCompare, nextDate);

    if (diff === 1) {
      streak++;
      currentDateToCompare = nextDate;
    } else if (diff === 0) {
      // same day somehow recorded twice? ignore
      continue;
    } else {
      // Break in streak
      break;
    }
  }

  return streak;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
