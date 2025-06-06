import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
      <Image
        src="/poker-bulls-club-logo.png" 
        alt="Poker Bulls Club Logo"
        width={283} 
        height={400} 
        className="h-12 w-auto object-contain" 
        data-ai-hint="poker card bull"
      />
      <span className="font-headline text-2xl font-semibold">Poker Bulls Championship</span>
    </Link>
  );
};

export default Logo;
