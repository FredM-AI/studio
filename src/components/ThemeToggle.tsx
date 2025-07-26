
'use client';

import * as React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Theme = "light" | "dark" | "classic";
const themes: Theme[] = ["light", "dark", "classic"];

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>('light');

  React.useEffect(() => {
    // On mount, read the theme from localStorage and apply it
    const storedTheme = localStorage.getItem('poker-theme') as Theme | null;
    const initialTheme = storedTheme && themes.includes(storedTheme) ? storedTheme : 'light';
    setTheme(initialTheme);
    
    // Clean up any other theme classes and apply the correct one
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(initialTheme);
  }, []);

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    // Update React state
    setTheme(nextTheme);

    // Update localStorage and apply the new class to the document
    localStorage.setItem('poker-theme', nextTheme);
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(nextTheme);
  };

  const renderIcon = () => {
    // Show the icon representing the current theme
    switch (theme) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />;
      case 'dark':
        return <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />;
      case 'classic':
         return <Palette className="h-[1.2rem] w-[1.2rem]" />;
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem]" />;
    }
  };
  
   const getNextThemeName = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    return themes[nextIndex];
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme} title={`Switch to ${getNextThemeName()} theme`}>
      {renderIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
