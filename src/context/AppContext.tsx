import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Task, Habit, SleepEntry, ChatMessage } from '../types';

export type TabName = 'today' | 'habits' | 'sleep' | 'chat';

interface AppState {
  tasks: Task[];
  habits: Habit[];
  sleepEntries: SleepEntry[];
  chatMessages: ChatMessage[];
  pendingChatQuery: string;
  activeTab: TabName;
}

type Action =
  | { type: 'SET_STATE'; payload: Omit<AppState, 'pendingChatQuery' | 'activeTab'> }
  | { type: 'SET_ACTIVE_TAB'; payload: TabName }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'TOGGLE_HABIT_ENTRY'; payload: { habitId: string; date: string; value: boolean } }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'ADD_SLEEP_ENTRY'; payload: SleepEntry }
  | { type: 'DELETE_SLEEP_ENTRY'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_PENDING_CHAT_QUERY'; payload: string };

const initialState: AppState = {
  tasks: [],
  habits: [],
  sleepEntries: [],
  chatMessages: [],
  pendingChatQuery: '',
  activeTab: 'today'
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'TOGGLE_HABIT_ENTRY':
      return {
        ...state,
        habits: state.habits.map(h => {
          if (h.id === action.payload.habitId) {
            return {
              ...h,
              entries: {
                ...h.entries,
                [action.payload.date]: action.payload.value
              }
            };
          }
          return h;
        })
      };
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };
    case 'ADD_SLEEP_ENTRY': {
      // replace if same date
      const filtered = state.sleepEntries.filter(s => s.date !== action.payload.date);
      return { ...state, sleepEntries: [...filtered, action.payload] };
    }
    case 'DELETE_SLEEP_ENTRY':
      return { ...state, sleepEntries: state.sleepEntries.filter(s => s.id !== action.payload) };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_PENDING_CHAT_QUERY':
      return { ...state, pendingChatQuery: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial state
  useEffect(() => {
    const saved = localStorage.getItem('adhd_app_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'SET_STATE', payload: parsed });
      } catch (e) {
        console.error('Failed to parse state from localStorage', e);
      }
    }
  }, []);

  // Save state on change
  useEffect(() => {
    // don't save pending chat query or active tab
    const { pendingChatQuery, activeTab, ...stateToSave } = state;
    localStorage.setItem('adhd_app_state', JSON.stringify(stateToSave));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
