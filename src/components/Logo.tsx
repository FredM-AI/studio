import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-3 text-primary hover:text-primary/90 transition-colors">
      <Image 
        src="/poker-bulls-club-logo.png"
        alt="Poker Bulls Club Logo"
        width={40}
        height={40}
        className="h-10 w-auto"
        unoptimized
      />
      <span className="font-headline text-lg font-bold uppercase leading-tight text-amber-500">
        Poker Bulls
      </span>
    </Link>
  );
};

export default Logo;
