export interface Task {
  id: string;
  title: string;
  completed: boolean;
  durationMinutes?: number;
  scheduledDate?: string;   // ISO date, e.g. "2026-09-08"
  scheduledTime?: string;   // "HH:mm", 24hr — undefined if unscheduled
  category?: string;        // used for color-coding
  createdAt: string;        // ISO timestamp
}

export interface Habit {
  id: string;
  name: string;
  createdAt: string;
  entries: Record<string, boolean>; // key = "YYYY-MM-DD", value = done?
}

export interface SleepEntry {
  id: string;
  date: string;       // "YYYY-MM-DD"
  hoursSlept: number;
  quality?: number;   // 1-5
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface InboxItem {
  id: string;
  text: string;
  createdAt: string;
}
