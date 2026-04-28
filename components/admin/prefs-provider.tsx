"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark" | "auto";
type Density = "comfortable" | "compact";

interface PrefsContextValue {
  theme: Theme;
  density: Density;
  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
}

function applyDensity(density: Density) {
  document.documentElement.dataset.density = density;
}

function persist(prefs: { theme: Theme; density: Density }) {
  document.cookie = `aperix_prefs=${encodeURIComponent(JSON.stringify(prefs))}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export function PrefsProvider({
  initialTheme,
  initialDensity,
  children,
}: {
  initialTheme: Theme;
  initialDensity: Density;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [density, setDensityState] = useState<Density>(initialDensity);

  useEffect(() => {
    applyTheme(theme);
    applyDensity(density);
  }, [theme, density]);

  useEffect(() => {
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    persist({ theme: t, density });
  }, [density]);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    persist({ theme, density: d });
  }, [theme]);

  return (
    <PrefsContext.Provider value={{ theme, density, setTheme, setDensity }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
