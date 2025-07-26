
'use client';

import * as React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Theme = "light" | "dark" | "classic";
const themes: Theme[] = ["light", "dark", "classic"];

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = React.useState<Theme>('light');

  React.useEffect(() => {
    const storedTheme = localStorage.getItem('poker-theme') as Theme | null;
    const initialTheme = storedTheme && themes.includes(storedTheme) ? storedTheme : 'light';
    setCurrentTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (theme: Theme) => {
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(theme);
    localStorage.setItem('poker-theme', theme);
  };

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 theme-classic:-rotate-90 theme-classic:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 theme-classic:-rotate-90 theme-classic:scale-0" />
      <Palette className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all theme-classic:rotate-0 theme-classic:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
