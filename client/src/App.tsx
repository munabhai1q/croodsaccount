import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "system">("system");

  // Fetch theme preference on mount
  useEffect(() => {
    const getSettings = async () => {
      try {
        const response = await apiRequest("GET", "/api/settings", undefined);
        const data = await response.json();
        setThemePreference(data.theme as "light" | "dark" | "system");
      } catch (error) {
        console.error("Failed to load theme settings:", error);
      }
    };

    getSettings();
  }, []);

  // Save theme preference when it changes
  const updateTheme = async (theme: "light" | "dark" | "system") => {
    setThemePreference(theme);
    try {
      await apiRequest("PATCH", "/api/settings", { theme });
    } catch (error) {
      console.error("Failed to save theme settings:", error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme={themePreference} onThemeChange={updateTheme}>
        <div className="h-screen overflow-hidden">
          {/* Background overlay with Croods theme - visible in all tabs */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-5 pointer-events-none z-0"
            style={{ backgroundImage: "url('/attached_assets/10825231.jpg')" }}
          />
          <Router />
          <Toaster />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
