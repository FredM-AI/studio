
'use client';

import * as React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Theme = "light" | "dark" | "classic";
const themes: Theme[] = ["light", "dark", "classic"];

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>('light');

  React.useEffect(() => {
    // On mount, read the theme from localStorage
    const storedTheme = localStorage.getItem('poker-theme') as Theme | null;
    if (storedTheme && themes.includes(storedTheme)) {
      setTheme(storedTheme);
      // Remove all possible theme classes and add the stored one
      document.documentElement.classList.remove(...themes);
      document.documentElement.classList.add(storedTheme);
    }
  }, []);

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    // Update React state
    setTheme(nextTheme);

    // Update localStorage and DOM
    localStorage.setItem('poker-theme', nextTheme);
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(nextTheme);
  };

  const renderIcon = () => {
    // Show the icon for the *next* theme that will be activated
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    
    switch (themes[nextIndex]) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem]" />;
      case 'classic':
        return <Palette className="h-[1.2rem] w-[1.2rem]" />;
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme} title={`Switch to ${themes[(themes.indexOf(theme) + 1) % themes.length]} theme`}>
      {renderIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
