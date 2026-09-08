import { useAppContext } from '../context/AppContext';
import type { SleepEntry } from '../types';

export function useSleep() {
  const { state, dispatch } = useAppContext();

  const addSleepEntry = (entry: SleepEntry) => dispatch({ type: 'ADD_SLEEP_ENTRY', payload: entry });
  const updateSleepEntry = (entry: SleepEntry) => dispatch({ type: 'UPDATE_SLEEP_ENTRY', payload: entry });

  return {
    sleepEntries: state.sleepEntries,
    addSleepEntry,
    updateSleepEntry,
  };
}
