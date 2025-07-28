import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-3 text-primary hover:text-primary/90 transition-colors">
      <Image
        src="/poker-bulls-championship-logo.png" 
        alt="Poker Bulls Championship Logo"
        width={400} 
        height={400} 
        className="h-14 w-auto object-contain" 
        data-ai-hint="poker bull logo"
      />
      <span className="font-headline text-2xl font-bold text-amber-500 tracking-wider">POKER BULLS CHAMPIONSHIP</span>
    </Link>
  );
};

export default Logo;
