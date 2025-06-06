
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react"; 

export default function AssistantPage() { 
  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold">AI Assistant</h1> 

      <Card>
        <CardHeader>
          <CardTitle>Assistant Chat</CardTitle> 
          <CardDescription>Interact with the AI assistant for help and information.</CardDescription> 
        </CardHeader>
        <CardContent className="text-center py-20">
           <Bot className="mx-auto h-16 w-16 text-muted-foreground mb-4" /> 
          <p className="text-muted-foreground text-xl">AI Assistant is coming soon!</p> 
          <p className="mt-2">You'll be able to ask questions, get insights, and more.</p> 
        </CardContent>
      </Card>
    </div>
  );
}
