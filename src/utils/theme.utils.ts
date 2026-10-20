export type Theme = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'scanms-theme';

export function getSavedTheme(): Theme {
  return 'light';
}

export function applyTheme(_theme: Theme) {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#FAF8F5');
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', 'light');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
  } catch {
    // The interface remains light for this session when storage is unavailable.
  }
}

export function saveTheme(_theme: Theme) {
  applyTheme('light');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
  } catch {
    // Switching still works when the browser disallows persistent storage.
  }
}
