
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut } from 'lucide-react';
import { logoutUser } from '@/app/login/actions'; // Assuming logoutUser is an action

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/events', label: 'Events' },
  { href: '/players', label: 'Players' },
  { href: '/seasons', label: 'Seasons' },
  { href: '/assistant', label: 'Assistant' }, // Changed here
];

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Logo />
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button key={item.label} variant="ghost" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
           <form action={logoutUser} className="ml-2">
            <Button variant="ghost" type="submit" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </form>
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
            <SheetContent side="right" className="w-[240px] p-4">
              <nav className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <Button key={item.label} variant="ghost" className="justify-start text-lg" asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                 <form action={logoutUser} className="mt-4">
                  <Button variant="outline" type="submit" className="w-full justify-start text-lg">
                    <LogOut className="mr-2 h-5 w-5" /> Logout
                  </Button>
                </form>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
