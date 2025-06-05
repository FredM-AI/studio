import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";

export default function EditEventPage({ params }: { params: { eventId: string } }) {
  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href={`/events/${params.eventId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Details
        </Link>
      </Button>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Edit Event (ID: {params.eventId})</CardTitle>
          <CardDescription>Modify the details for this poker event.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-20">
          <Edit className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-xl">Event Editing Form Coming Soon!</p>
          <p className="mt-2">This form will allow you to update the selected event.</p>
        </CardContent>
      </Card>
    </div>
  );
}
