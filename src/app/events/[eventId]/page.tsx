import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

export default function EventDetailsPage({ params }: { params: { eventId: string } }) {
  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Link>
      </Button>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Event Details (ID: {params.eventId})</CardTitle>
          <CardDescription>Viewing details for a specific event.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-20">
          <Eye className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-xl">Event Details Display Coming Soon!</p>
          <p className="mt-2">This page will show all information about the selected event.</p>
        </CardContent>
      </Card>
    </div>
  );
}
