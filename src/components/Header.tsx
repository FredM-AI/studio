
'use client'; 

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, Home, MessageSquare, CalendarDays, Users, BarChart3, LogIn, Trophy, Palette, ListTree } from 'lucide-react';
import { logoutUser } from '@/app/login/actions';
import { usePathname } from 'next/navigation'; 
import ThemeToggle from './ThemeToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const Header = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const pathname = usePathname(); 

  const championshipItems = [
    { href: '/seasons', label: 'Seasons', icon: BarChart3 },
    { href: '/events', label: 'Events', icon: CalendarDays },
  ];

  const playerItem = { href: '/players', label: 'Players', icon: Users };
  const assistantItem = { href: '/assistant', label: 'Assistant', icon: MessageSquare };

  const showNav = pathname !== '/login';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        
        {showNav && ( 
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <ListTree className="mr-2 h-4 w-4" />
                    Championships
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {championshipItems.map(item => (
                     <DropdownMenuItem key={item.label} asChild>
                       <Link href={item.href}>
                         <item.icon className="mr-2 h-4 w-4" />
                         {item.label}
                       </Link>
                     </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="ghost" asChild>
                <Link href="/hall-of-fame">
                  <Trophy className="mr-2 h-4 w-4" />
                  HOF
                </Link>
              </Button>

              <Button variant="ghost" asChild>
                <Link href={playerItem.href}>
                  <playerItem.icon className="mr-2 h-4 w-4" />
                  {playerItem.label}
                </Link>
              </Button>
              
              {isAuthenticated && (
                 <Button variant="ghost" asChild>
                  <Link href={assistantItem.href}>
                    <assistantItem.icon className="mr-2 h-4 w-4" />
                    {assistantItem.label}
                  </Link>
                </Button>
              )}


              <div className="flex items-center gap-2 ml-2">
                <ThemeToggle />
                {isAuthenticated ? (
                  <form action={logoutUser}>
                    <Button variant="ghost" type="submit" size="sm">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                  </form>
                ) : (
                  <Button variant="ghost" asChild>
                    <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" /> Login
                    </Link>
                  </Button>
                )}
              </div>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[260px] p-4">
                  <nav className="flex flex-col gap-2 mt-6">
                     <Button variant="ghost" className="justify-start text-base py-3 h-auto" asChild>
                        <Link href="/dashboard">
                          <Home className="mr-3 h-5 w-5" />
                          Dashboard
                        </Link>
                      </Button>
                    <p className="text-sm font-medium text-muted-foreground px-4 pt-2">Championships</p>
                    {championshipItems.map((item) => (
                      <Button key={item.label} variant="ghost" className="justify-start text-base py-3 h-auto" asChild>
                        <Link href={item.href}>
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                    <Button variant="ghost" className="justify-start text-base py-3 h-auto" asChild>
                        <Link href="/hall-of-fame">
                          <Trophy className="mr-3 h-5 w-5" />
                          HOF
                        </Link>
                      </Button>
                     <Button variant="ghost" className="justify-start text-base py-3 h-auto" asChild>
                        <Link href={playerItem.href}>
                          <playerItem.icon className="mr-3 h-5 w-5" />
                          {playerItem.label}
                        </Link>
                      </Button>
                     {isAuthenticated && (
                       <Button variant="ghost" className="justify-start text-base py-3 h-auto" asChild>
                          <Link href={assistantItem.href}>
                            <assistantItem.icon className="mr-3 h-5 w-5" />
                            {assistantItem.label}
                          </Link>
                        </Button>
                      )}

                    <div className="mt-4 border-t pt-4">
                      {isAuthenticated ? (
                        <form action={logoutUser}>
                          <Button variant="outline" type="submit" className="w-full justify-start text-base py-3 h-auto">
                            <LogOut className="mr-3 h-5 w-5" /> Logout
                          </Button>
                        </form>
                      ) : (
                       <Button variant="outline" className="w-full justify-start text-base py-3 h-auto" asChild>
                        <Link href="/login">
                          <LogIn className="mr-3 h-5 w-5" /> Login
                        </Link>
                      </Button>
                      )}
                    </div>
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
