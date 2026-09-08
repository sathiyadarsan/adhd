import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PageShell } from './components/layout/PageShell';

import { TodayView } from './views/TodayView';
import { CalendarView } from './views/CalendarView';
import { HabitsView } from './views/HabitsView';
import { SleepView } from './views/SleepView';
import { ChatView } from './views/ChatView';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <PageShell>
          <Routes>
            <Route path="/" element={<TodayView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/habits" element={<HabitsView />} />
            <Route path="/sleep" element={<SleepView />} />
            <Route path="/chat" element={<ChatView />} />
          </Routes>
        </PageShell>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
