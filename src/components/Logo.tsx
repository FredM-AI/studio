import Link from 'next/link';
import Image from 'next/image';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-3 text-primary hover:text-primary/90 transition-colors">
      <Image 
        src="/poker-bulls-club-logo.png"
        alt="Poker Bulls Club Logo"
        width={50}
        height={50}
        className="h-12 w-auto"
        unoptimized
      />
      <span className="font-headline text-xl font-bold uppercase leading-tight text-amber-500">
        Poker Bulls
      </span>
    </Link>
  );
};

export default Logo;
