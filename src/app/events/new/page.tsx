import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import Link from "next/link";

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Link>
      </Button>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create New Event</CardTitle>
          <CardDescription>Fill in the details to schedule a new poker event.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-20">
          <CalendarPlus className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-xl">Event Creation Form Coming Soon!</p>
          <p className="mt-2">This form will allow you to configure all aspects of your new event.</p>
        </CardContent>
      </Card>
    </div>
  );
}
