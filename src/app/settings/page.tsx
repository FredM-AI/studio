
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react"; // Changed from SettingsIcon

export default function AssistantPage() { // Renamed from SettingsPage
  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold">AI Assistant</h1> {/* Changed title */}

      <Card>
        <CardHeader>
          <CardTitle>Assistant Chat</CardTitle> {/* Changed title */}
          <CardDescription>Interact with the AI assistant for help and information.</CardDescription> {/* Changed description */}
        </CardHeader>
        <CardContent className="text-center py-20">
           <Bot className="mx-auto h-16 w-16 text-muted-foreground mb-4" /> {/* Changed icon */}
          <p className="text-muted-foreground text-xl">AI Assistant is coming soon!</p> {/* Changed message */}
          <p className="mt-2">You'll be able to ask questions, get insights, and more.</p> {/* Changed message */}
        </CardContent>
      </Card>
    </div>
  );
}
