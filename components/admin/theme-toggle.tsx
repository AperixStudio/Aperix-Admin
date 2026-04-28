"use client";

import { usePrefs } from "@/components/admin/prefs-provider";

export function ThemeToggle() {
  const { theme, setTheme } = usePrefs();
  const cycle = () => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "auto" : "light");
  };
  const icon = theme === "dark" ? "☾" : theme === "light" ? "☀" : "◐";
  const label = `Theme: ${theme}`;
  return (
    <button type="button" className="topbar-icon-btn" onClick={cycle} aria-label={label} title={label}>
      <span aria-hidden>{icon}</span>
    </button>
  );
}
