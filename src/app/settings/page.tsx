
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AssistantChatForm from "@/app/assistant/AssistantChatForm";

// Simple Bull SVG Icon
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
    <path d="M16 16c-1.657 1.657-4.343 1.657-6 0"/>
    <path d="M12 2c-3.5 0-7 2-7 8.5c0 3.286 1.714 6.5 4.5 6.5c1.929 0 3.5-1.071 3.5-1.071s1.571 1.071 3.5 1.071c2.786 0 4.5-3.214 4.5-6.5C19 4 15.5 2 12 2Z"/>
    <path d="M6 10c-1.105 0-2 .895-2 2s.895 2 2 2"/>
    <path d="M18 10c1.105 0 2 .895 2 2s-.895 2-2 2"/>
  </svg>
);

export default function AssistantPage() { 
  return (
    <div className="space-y-8">
      <div className="text-center">
        <BullIcon className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="font-headline text-3xl font-bold text-foreground">El Toro ton Coach Poker</h1> 
        <p className="text-muted-foreground mt-2">
          Interagis avec El Toro. Tape ton message ci-dessous et appuie sur Entrée ou clique sur Envoyer.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg rounded-xl">
        <CardContent className="p-0">
          <AssistantChatForm />
        </CardContent>
      </Card>
    </div>
  );
}
