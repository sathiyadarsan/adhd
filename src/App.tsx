import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PageShell } from './components/layout/PageShell';

import { TodayView } from './views/TodayView';
import { HabitsView } from './views/HabitsView';
import { SleepView } from './views/SleepView';
import { ChatView } from './views/ChatView';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PageShell />}>
            <Route index element={<TodayView />} />
            <Route path="habits" element={<HabitsView />} />
            <Route path="sleep" element={<SleepView />} />
            <Route path="chat" element={<ChatView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
