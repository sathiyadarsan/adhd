import type { Habit } from '../types';
import { differenceInDays, parseISO, isToday, isYesterday, startOfWeek, isSameWeek } from 'date-fns';

export function calculateStreak(habit: Habit): number {
  if (!habit.entries || Object.keys(habit.entries).length === 0) {
    return 0;
  }

  const completedDates = Object.entries(habit.entries)
    .filter(([_, completed]) => completed)
    .map(([dateString]) => parseISO(dateString))
    .sort((a, b) => b.getTime() - a.getTime());

  if (completedDates.length === 0) {
    return 0;
  }

  // Handle Weekly Habits
  if (habit.goalType === 'weekly' && habit.weeklyTarget) {
    // Group dates by week starting on Monday
    const weekMap = new Map<string, number>(); // key: weekStart timestamp, value: count

    for (const d of completedDates) {
      const weekStart = startOfWeek(d, { weekStartsOn: 1 }).getTime().toString();
      weekMap.set(weekStart, (weekMap.get(weekStart) || 0) + 1);
    }

    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }).getTime().toString();
    const lastWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekStartStr = lastWeekStart.getTime().toString();

    // The streak must be alive. Meaning, they must have either hit the target THIS week,
    // OR hit the target LAST week (giving them the current week to still hit it).

    // Sort weeks descending
    const sortedWeeks = Array.from(weekMap.keys())
      .map(k => Number(k))
      .sort((a, b) => b - a);

    if (sortedWeeks.length === 0) return 0;

    const mostRecentWeek = sortedWeeks[0];

    // If the most recent week with any activity is older than last week, the streak is broken
    if (mostRecentWeek < Number(lastWeekStartStr)) {
      return 0;
    }

    let streak = 0;
    let expectedNextWeek = mostRecentWeek; // start checking from the most recent week with activity

    // However, if the most recent week is the current week, but they HAVEN'T hit the target yet,
    // we should really start counting the streak from LAST week.
    // If they HAVE hit the target this week, then start from this week.
    let startingIndex = 0;
    const countThisWeek = weekMap.get(currentWeekStart) || 0;

    if (mostRecentWeek === Number(currentWeekStart)) {
      if (countThisWeek >= habit.weeklyTarget) {
        streak++;
        expectedNextWeek = Number(lastWeekStartStr);
        startingIndex = 1;
      } else {
        // Not hit yet this week, streak is dependent entirely on past weeks.
        expectedNextWeek = Number(lastWeekStartStr);
        startingIndex = 1; // start analyzing from the week prior to current
      }
    }

    for (let i = startingIndex; i < sortedWeeks.length; i++) {
      const week = sortedWeeks[i];
      if (week === expectedNextWeek) {
        if ((weekMap.get(week.toString()) || 0) >= habit.weeklyTarget) {
          streak++;
          // go back 7 days
          const prev = new Date(week);
          prev.setDate(prev.getDate() - 7);
          expectedNextWeek = prev.getTime();
        } else {
          break; // missed target this week
        }
      } else if (week < expectedNextWeek) {
        break; // skip a week
      }
    }

    return streak;
  }

  // Handle Daily Habits (Default)
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
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function getWeeklyProgress(habit: Habit): number {
  if (habit.goalType !== 'weekly' || !habit.entries) return 0;

  const today = new Date();
  let count = 0;
  for (const [dateStr, completed] of Object.entries(habit.entries)) {
    if (completed && isSameWeek(parseISO(dateStr), today, { weekStartsOn: 1 })) {
      count++;
    }
  }
  return count;
}