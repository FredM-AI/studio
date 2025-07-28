import Link from 'next/link';
import Image from 'next/image';

const BullIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      {/* Horns */}
      <path d="M5 9C2.5 7.5 3 4 7 4" />
      <path d="M19 9C21.5 7.5 21 4 17 4" />
  
      {/* Head Top */}
      <path d="M7 4C8.5 2.5 15.5 2.5 17 4" />
  
      {/* Face Outline & Snout Area */}
      <path d="M17 4L19 9L17 14L15.5 18C14.5 20 9.5 20 8.5 18L7 14L5 9L7 4Z" />
      
      {/* Eye Details (X shapes for an intense look) */}
      <path d="M9 10.5L10.5 11.5" />
      <path d="M10.5 10.5L9 11.5" /> 
      <path d="M15 10.5L13.5 11.5" />
      <path d="M13.5 10.5L15 11.5" />
  
      {/* Snout line */}
      <path d="M9 16C10.5 17.5 13.5 17.5 15 16" />
    </svg>
  );

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-3 text-primary hover:text-primary/90 transition-colors">
      <BullIcon className="h-10 w-auto" />
      <span className="font-headline text-lg font-bold uppercase leading-tight text-amber-500">
        Poker Bulls
      </span>
    </Link>
  );
};

export default Logo;
