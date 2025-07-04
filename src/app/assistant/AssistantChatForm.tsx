
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; // Removed AvatarImage
import { SendHorizontal, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

// New Bull SVG Icon inspired by the provided image (consistent with assistant page)
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

const ASSISTANT_WEBHOOK_URL = 'https://n8n-cio9.onrender.com/webhook-test/23b89964-aef6-457a-8f88-c9abd537fea3';

export default function AssistantChatForm() {
  const [inputValue, setInputValue] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(ASSISTANT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      let assistantReplyText = "Received acknowledgment from assistant.";

      if (!response.ok) {
        let errorDetails = "Could not retrieve error details from response body.";
        try {
          errorDetails = await response.text();
        } catch (textError) {
          console.warn("Failed to read error response body as text:", textError);
        }
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}. Details: ${errorDetails}`);
      }
      
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const responseData = await response.json();
        
        if (responseData && typeof responseData.output === 'string') {
          assistantReplyText = responseData.output;
        } else if (responseData && responseData.reply) { // Fallback for other possible reply structures
          assistantReplyText = responseData.reply;
        } else if (Array.isArray(responseData) && responseData.length > 0 && responseData[0]?.body?.message) {
           // Handling specific n8n test webhook structure if no 'output' or 'reply'
           assistantReplyText = `Echo: ${responseData[0].body.message}`;
        } else if (responseData && responseData.message === "Workflow0 was started"){
           assistantReplyText = "Message received by the assistant. Waiting for processing...";
        } else if (responseData) {
           assistantReplyText = `Received unhandled JSON: ${JSON.stringify(responseData)}`;
        } else {
           assistantReplyText = "Received an empty JSON response from assistant.";
        }
      } else {
        const textResponse = await response.text();
        if (textResponse && textResponse.trim()) {
          assistantReplyText = textResponse;
        } else {
          assistantReplyText = "Received an empty or non-text response from assistant.";
        }
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        text: assistantReplyText,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: any) {
      console.error("Webhook call failed:", err);
      setError(err.message || 'Failed to send message to assistant.');
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: `Error: ${err.message || 'Could not connect to assistant.'}`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[600px] bg-background">
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'flex items-end gap-2 mb-4',
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.sender === 'assistant' && (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground p-1.5">
                  <BullIcon className="h-full w-full" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                'max-w-[70%] p-3 rounded-lg shadow',
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-card text-card-foreground rounded-bl-none' 
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={cn(
                  "text-xs mt-1",
                  msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/80 text-left'
              )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.sender === 'user' && (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.sender === 'user' && (
           <div className="flex items-end gap-2 mb-4 justify-start">
             <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground p-1.5">
                  <BullIcon className="h-full w-full" />
                </AvatarFallback>
              </Avatar>
             <div className="max-w-[70%] p-3 rounded-lg shadow bg-card text-card-foreground rounded-bl-none">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
             </div>
           </div>
        )}
      </ScrollArea>
      
      {error && (
        <div className="p-2 text-center text-sm text-destructive bg-destructive/10">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t border-border">
        <Input
          type="text"
          placeholder="Message El Toro..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          disabled={isLoading}
          className="flex-grow bg-input text-foreground placeholder:text-muted-foreground/70"
          aria-label="Chat message input"
        />
        <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
