"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function useTheme() {
  const { theme, setTheme } = React.useContext(
    React.createContext({ theme: "", setTheme: (theme: string) => {} })
  );

  // Use the next-themes hook
  const { theme: nextTheme, setTheme: nextSetTheme } = useNextTheme();

  // Return the next-themes values
  return {
    theme: nextTheme,
    setTheme: nextSetTheme,
  };
}

// Import the useTheme hook from next-themes
interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  systemTheme?: string;
}

function useNextTheme() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme, systemTheme } = React.useContext<ThemeContextType>(
    // @ts-ignore - the context does exist
    window.nextThemesContext ??
      React.createContext({ theme: "", setTheme: (theme: string) => {} })
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: mounted ? theme : "",
    setTheme,
    systemTheme,
  };
}
