import React, { createContext, useContext, useReducer, useEffect } from "react"; import type { ReactNode } from 'react';
import type { Task, Habit, SleepEntry, ChatMessage } from '../types';

export interface AppState {
  tasks: Task[];
  habits: Habit[];
  sleepEntries: SleepEntry[];
  chatMessages: ChatMessage[];
}

export type AppAction =
  // Tasks
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SCHEDULE_TASK'; payload: { id: string; date: string; time?: string } }
  // Habits
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'REMOVE_HABIT'; payload: string }
  | { type: 'TOGGLE_HABIT_ENTRY'; payload: { habitId: string; date: string; done: boolean } }
  // Sleep
  | { type: 'ADD_SLEEP_ENTRY'; payload: SleepEntry }
  | { type: 'UPDATE_SLEEP_ENTRY'; payload: SleepEntry }
  // Chat
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  // Hydrate
  | { type: 'HYDRATE'; payload: AppState };

const initialState: AppState = {
  tasks: [],
  habits: [],
  sleepEntries: [],
  chatMessages: [],
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    // Tasks
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };
    case 'SCHEDULE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? { ...t, scheduledDate: action.payload.date, scheduledTime: action.payload.time }
            : t
        ),
      };

    // Habits
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'REMOVE_HABIT':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.payload) };
    case 'TOGGLE_HABIT_ENTRY':
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id === action.payload.habitId) {
            return {
              ...h,
              entries: {
                ...h.entries,
                [action.payload.date]: action.payload.done,
              },
            };
          }
          return h;
        }),
      };

    // Sleep
    case 'ADD_SLEEP_ENTRY': {
      const existingIdx = state.sleepEntries.findIndex(e => e.date === action.payload.date);
      if (existingIdx !== -1) {
        const updated = [...state.sleepEntries];
        updated[existingIdx] = action.payload;
        return { ...state, sleepEntries: updated };
      }
      return { ...state, sleepEntries: [...state.sleepEntries, action.payload] };
    }
    case 'UPDATE_SLEEP_ENTRY':
      return {
        ...state,
        sleepEntries: state.sleepEntries.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };

    // Chat
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'adhd_app_data';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initial load
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppState;
        dispatch({ type: 'HYDRATE', payload: parsed });
      } catch (e) {
        console.error('Failed to parse local storage data', e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    // skip initial empty state save over hydrated state
    if (state !== initialState) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
