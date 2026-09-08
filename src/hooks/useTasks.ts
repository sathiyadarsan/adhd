import { useAppContext } from '../context/AppContext';
import type { Task } from '../types';

export function useTasks() {
  const { state, dispatch } = useAppContext();

  const addTask = (task: Task) => dispatch({ type: 'ADD_TASK', payload: task });
  const updateTask = (task: Task) => dispatch({ type: 'UPDATE_TASK', payload: task });
  const deleteTask = (id: string) => dispatch({ type: 'DELETE_TASK', payload: id });
  const scheduleTask = (id: string, date: string, time?: string) =>
    dispatch({ type: 'SCHEDULE_TASK', payload: { id, date, time } });

  return {
    tasks: state.tasks,
    addTask,
    updateTask,
    deleteTask,
    scheduleTask,
  };
}
