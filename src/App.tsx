import { AppProvider } from './context/AppContext';
import { PageShell } from './components/layout/PageShell';

import { useEffect } from 'react';
import { useAppContext } from './context/AppContext';

function ThemeManager() {
  const { state } = useAppContext();

  useEffect(() => {
    const root = document.documentElement;
    const presets: Record<string, { bg: string, card: string, border: string, accent: string, secondary: string }> = {
      'editor-dark': { bg: '15 23 42', card: '30 41 59', border: '51 65 85', accent: '99 102 241', secondary: '45 212 191' },
      'warm-dark': { bg: '28 25 23', card: '41 37 36', border: '68 64 60', accent: '249 115 22', secondary: '234 179 8' },
      'cool-gray': { bg: '39 39 42', card: '63 63 70', border: '82 82 91', accent: '56 189 248', secondary: '167 139 250' }
    };

    let colors = presets['editor-dark'];
    if (state.theme.preset === 'custom' && state.theme.customColors) {
      colors = state.theme.customColors;
    } else if (presets[state.theme.preset]) {
      colors = presets[state.theme.preset];
    }

    root.style.setProperty('--color-bg', colors.bg);
    root.style.setProperty('--color-card', colors.card);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-secondary', colors.secondary);
  }, [state.theme]);

  return null;
}

function App() {
  return (
    <AppProvider>
      <ThemeManager />
      <PageShell />
    </AppProvider>
  );
}

export default App;
