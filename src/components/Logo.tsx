import { Coins } from 'lucide-react';
import Link from 'next/link';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
      <Coins className="h-8 w-8" />
      <span className="font-headline text-2xl font-semibold">PokerManager</span>
    </Link>
  );
};

export default Logo;
