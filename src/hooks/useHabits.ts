import { useAppContext } from '../context/AppContext';
import type { Habit } from '../types';

export function useHabits() {
  const { state, dispatch } = useAppContext();

  const addHabit = (habit: Habit) => dispatch({ type: 'ADD_HABIT', payload: habit });
  const removeHabit = (id: string) => dispatch({ type: 'REMOVE_HABIT', payload: id });
  const toggleHabitEntry = (habitId: string, date: string, done: boolean) =>
    dispatch({ type: 'TOGGLE_HABIT_ENTRY', payload: { habitId, date, done } });

  return {
    habits: state.habits,
    addHabit,
    removeHabit,
    toggleHabitEntry,
  };
}
