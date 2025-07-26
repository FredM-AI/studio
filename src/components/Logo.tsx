import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-3 text-primary hover:text-primary/90 transition-colors">
      <Image
        src="/poker-bulls-club-logo.png" 
        alt="Bulls Poker Club Logo"
        width={283} 
        height={400} 
        className="h-12 w-auto object-contain" 
        data-ai-hint="poker card bull"
      />
      <span className="font-headline text-2xl font-bold text-amber-500 tracking-wider">BULLS POKER CLUB</span>
    </Link>
  );
};

export default Logo;
