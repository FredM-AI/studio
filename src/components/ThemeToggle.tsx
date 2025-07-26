
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<'theme-light' | 'theme-dark'>('theme-light');

  React.useEffect(() => {
    const storedTheme = localStorage.getItem('poker-theme') as 'theme-light' | 'theme-dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.add(storedTheme === 'theme-dark' ? 'dark' : 'light');
       if(storedTheme === 'theme-dark') {
         document.documentElement.classList.remove('light');
         document.documentElement.classList.add('dark');
      } else {
         document.documentElement.classList.remove('dark');
         document.documentElement.classList.add('light');
      }
    } else {
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'theme-light' ? 'theme-dark' : 'theme-light';
    setTheme(newTheme);
    localStorage.setItem('poker-theme', newTheme);
    if (newTheme === 'theme-dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
