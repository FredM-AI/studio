
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react"; 
import AssistantChatForm from "@/app/assistant/AssistantChatForm";

export default function AssistantPage() { 
  return (
    <div className="space-y-8">
      <div className="text-center">
        <Bot className="mx-auto h-12 w-12 text-primary mb-3" />
        <h1 className="font-headline text-3xl font-bold">AI Assistant Chat</h1> 
        <p className="text-muted-foreground">
          Interact with the AI assistant. Type your message below and press Enter or click Send.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-0">
          <AssistantChatForm />
        </CardContent>
      </Card>
    </div>
  );
}
