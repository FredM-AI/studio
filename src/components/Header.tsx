
'use client'; // Make it a client component

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, Home, MessageSquare, CalendarDays, Users, BarChart3, LogIn, Trophy } from 'lucide-react';
import { logoutUser } from '@/app/login/actions';
import { usePathname } from 'next/navigation'; // Import usePathname

// Accept isAuthenticated as a prop
const Header = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const pathname = usePathname(); // Get current path

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/hall-of-fame', label: 'HOF', icon: Trophy },
    { href: '/events', label: 'Events', icon: CalendarDays },
    { href: '/players', label: 'Players', icon: Users },
    { href: '/seasons', label: 'Seasons', icon: BarChart3 },
  ];

  if (isAuthenticated) {
    navItems.push({ href: '/assistant', label: 'Assistant', icon: MessageSquare });
  }

  const showNav = pathname !== '/login';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        
        {showNav && ( 
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Button key={item.label} variant="ghost" asChild>
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
              {isAuthenticated ? (
                <form action={logoutUser} className="ml-2">
                  <Button variant="ghost" type="submit" size="sm">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                </form>
              ) : (
                <Button variant="ghost" asChild className="ml-2">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Link>
                </Button>
              )}
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[260px] p-4">
                  <nav className="flex flex-col gap-2 mt-6">
                    {navItems.map((item) => (
                      <Button key={item.label} variant="ghost" className="justify-start text-base py-3 h-auto" asChild>
                        <Link href={item.href}>
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                    {isAuthenticated ? (
                      <form action={logoutUser} className="mt-4 border-t pt-4">
                        <Button variant="outline" type="submit" className="w-full justify-start text-base py-3 h-auto">
                          <LogOut className="mr-3 h-5 w-5" /> Logout
                        </Button>
                      </form>
                    ) : (
                       <Button variant="outline" className="w-full justify-start text-base py-3 h-auto mt-4 border-t pt-4" asChild>
                        <Link href="/login">
                          <LogIn className="mr-3 h-5 w-5" /> Login
                        </Link>
                      </Button>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
