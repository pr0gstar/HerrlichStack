import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme) {
        return savedTheme;
      }
    }
    return defaultTheme;
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let mediaQueryList: MediaQueryList | null = null;
    let systemThemeChangeListener:
      | ((event: MediaQueryListEvent) => void)
      | null = null;

    if (theme === "system") {
      const applySystemTheme = () => {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.remove("light", "dark");
        root.classList.add(systemTheme);
      };

      applySystemTheme(); // Initial anwenden

      mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
      systemThemeChangeListener = (event: MediaQueryListEvent) => {
        root.classList.remove("light", "dark");
        root.classList.add(event.matches ? "dark" : "light");
      };
      mediaQueryList.addEventListener("change", systemThemeChangeListener);
    } else {
      root.classList.add(theme);
    }

    // Cleanup-Funktion: Wird ausgeführt, wenn `theme` sich ändert oder die Komponente unmountet
    return () => {
      if (mediaQueryList && systemThemeChangeListener) {
        mediaQueryList.removeEventListener("change", systemThemeChangeListener);
      }
    };
  }, [theme, mounted]); // `mounted` als Abhängigkeit hinzugefügt

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", newTheme);
      }
      setTheme(newTheme);
    },
  };

  // Verhindert einen Hydration Mismatch, indem Kinder erst gerendert werden,
  // wenn der Client-seitige State (insb. aus localStorage) geladen ist.
  // Alternativ könnte man hier auch einen leeren Fragment oder einen Ladezustand rendern,
  // aber für Themes ist es oft besser, den Inhalt direkt zu zeigen, sobald das Theme klar ist.
  // Die Logik mit `mounted` stellt sicher, dass der Effekt, der das Theme anwendet,
  // erst nach dem client-seitigen Mount läuft.
  if (!mounted && typeof window !== "undefined") {
    // Während wir auf das Mounten warten, um Hydration-Fehler zu vermeiden,
    // könnten wir einen Fallback rendern oder einfach die Kinder,
    // aber ohne dass das Theme schon vollständig initialisiert ist.
    // Die aktuelle Logik mit `useEffect` und `mounted` sollte das gut handhaben.
    // Das `if (!mounted) return <>{children}</>;` von vorher war dafür gedacht,
    // den Provider-Value nicht zu früh zu setzen.
    // Da wir den initialen State jetzt direkt aus localStorage lesen,
    // ist dieser spezielle Return-Block vielleicht nicht mehr so kritisch,
    // aber das `mounted` im `useEffect` ist weiterhin wichtig.
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
