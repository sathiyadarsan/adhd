import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Task, Habit, SleepEntry, ChatMessage, InboxItem } from '../types';

export type TabName = 'inbox' | 'today' | 'habits' | 'sleep' | 'chat';

interface AppState {
  tasks: Task[];
  habits: Habit[];
  sleepEntries: SleepEntry[];
  chatMessages: ChatMessage[];
  inboxItems: InboxItem[];
  pendingChatQuery: string;
  activeTab: TabName;
  fabState: {
    isOpen: boolean;
    initialTitle: string;
    initialTime: string;
  };
}

type Action =
  | { type: 'SET_STATE'; payload: Partial<AppState> }
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
  | { type: 'SET_PENDING_CHAT_QUERY'; payload: string }
  | { type: 'ADD_INBOX_ITEM'; payload: InboxItem }
  | { type: 'DELETE_INBOX_ITEM'; payload: string }
  | { type: 'OPEN_TASK_FAB'; payload: { initialTitle?: string; initialTime?: string } }
  | { type: 'CLOSE_TASK_FAB' };

const initialState: AppState = {
  tasks: [],
  habits: [],
  sleepEntries: [],
  chatMessages: [],
  inboxItems: [],
  pendingChatQuery: '',
  activeTab: 'today',
  fabState: {
    isOpen: false,
    initialTitle: '',
    initialTime: '',
  }
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
      const filtered = state.sleepEntries.filter(s => s.date !== action.payload.date);
      return { ...state, sleepEntries: [...filtered, action.payload] };
    }
    case 'DELETE_SLEEP_ENTRY':
      return { ...state, sleepEntries: state.sleepEntries.filter(s => s.id !== action.payload) };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_PENDING_CHAT_QUERY':
      return { ...state, pendingChatQuery: action.payload };
    case 'ADD_INBOX_ITEM':
      return { ...state, inboxItems: [...state.inboxItems, action.payload] };
    case 'DELETE_INBOX_ITEM':
      return { ...state, inboxItems: state.inboxItems.filter(i => i.id !== action.payload) };
    case 'OPEN_TASK_FAB':
      return {
        ...state,
        fabState: {
          isOpen: true,
          initialTitle: action.payload.initialTitle || '',
          initialTime: action.payload.initialTime || ''
        }
      };
    case 'CLOSE_TASK_FAB':
      return {
        ...state,
        fabState: { isOpen: false, initialTitle: '', initialTime: '' }
      };
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
        // ensure inboxItems exists for old state
        if (!parsed.inboxItems) parsed.inboxItems = [];
        dispatch({ type: 'SET_STATE', payload: parsed });
      } catch (e) {
        console.error('Failed to parse state from localStorage', e);
      }
    }
  }, []);

  // Save state on change
  useEffect(() => {
    // don't save transient state like pending query, active tab, or fab state
    const { pendingChatQuery, activeTab, fabState, ...stateToSave } = state;
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
