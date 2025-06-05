import { Coins } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
      <Coins className="h-8 w-8" />
      <Image
        src="/bulls_logo.png" // Remplacez par le chemin de votre logo, ex: /bull-logo.png
        alt="Poker Club Bulls Logo"
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
        data-ai-hint="bull logo"
      />
      <span className="font-headline text-2xl font-semibold">Poker Bulls Championship</span>
    </Link>
  );
};

export default Logo;
