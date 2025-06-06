
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AssistantChatForm from "@/app/assistant/AssistantChatForm";

// New Bull SVG Icon inspired by the provided image
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
