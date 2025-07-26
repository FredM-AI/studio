
'use client';

import * as React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Theme = "light" | "dark" | "classic";
const themes: Theme[] = ["light", "dark", "classic"];

export default function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);

  const setTheme = (theme: Theme) => {
    localStorage.setItem('poker-theme', theme);
    // Remove all possible theme classes
    document.documentElement.classList.remove('light', 'dark', 'theme-classic');
    // Add the selected theme class
    if (theme === 'classic') {
      document.documentElement.classList.add('theme-classic');
    } else {
      document.documentElement.classList.add(theme);
    }
  };

  React.useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('poker-theme') as Theme | null;
    if (storedTheme && themes.includes(storedTheme)) {
        setTheme(storedTheme);
    } else {
        setTheme('light');
    }
  }, []);
  
  if (!mounted) {
    // Avoid rendering the toggle on the server to prevent hydration mismatch
    return <div style={{width: '40px', height: '40px'}} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('classic')}>
           <Palette className="mr-2 h-4 w-4" />
          <span>Classic</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
