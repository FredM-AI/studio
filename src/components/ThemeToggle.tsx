
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

  React.useEffect(() => {
    setMounted(true);
    // On mount, ensure the correct theme class is on the html tag
    const storedTheme = localStorage.getItem('poker-theme') as Theme | null;
    if (storedTheme && themes.includes(storedTheme)) {
        document.documentElement.classList.remove(...themes);
        document.documentElement.classList.add(storedTheme);
    } else {
        document.documentElement.classList.add('light');
    }
  }, []);

  const setTheme = (theme: Theme) => {
    localStorage.setItem('poker-theme', theme);
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(theme);
  };
  
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
