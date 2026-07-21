import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'refurbinics-theme';

const ThemeContext = createContext(null);

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

// Tracks the light/dark preference (Navbar/Sidebar/page background) in
// localStorage, shared by the admin and client shells — see DashboardLayout.
// The technician portal stays permanently dark regardless of this setting.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
