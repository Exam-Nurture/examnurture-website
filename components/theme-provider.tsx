"use client";

import * as React from "react";

// Suppress the React 19 false-positive warning about inline script tags during client hydration.
// Since the theme-initializer script runs perfectly during server-side rendering, this is safe to suppress.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Encountered a script tag") ||
        args[0].includes("Scripts inside React components are never executed"))
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

type Theme = "dark" | "light" | "system";

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  disableTransitionOnChange = false,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const applyTheme = React.useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;

    // Briefly disable all CSS transitions to avoid colour-flash during switch
    if (disableTransitionOnChange) {
      const style = document.createElement("style");
      style.textContent = "*,*::before,*::after{transition:none!important}";
      document.head.appendChild(style);
      // Re-enable after the browser has painted the new frame
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => { document.head.removeChild(style); });
      });
    }

    const resolvedTheme =
      newTheme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        : newTheme;

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    // Keep native browser UI (inputs, scrollbars, autofill) in sync
    root.style.colorScheme = resolvedTheme;
    localStorage.setItem("theme", newTheme);
  }, [disableTransitionOnChange]);

  React.useEffect(() => {
    applyTheme(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
