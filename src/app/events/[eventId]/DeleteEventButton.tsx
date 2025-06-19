
'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteEvent } from '@/app/events/actions';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface DeleteEventButtonProps {
  eventId: string;
  eventName: string;
  className?: string;
}

export default function DeleteEventButton({ eventId, eventName, className }: DeleteEventButtonProps) {
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteEvent(eventId);
    setIsDeleting(false);
    // setIsAlertOpen(false); // Dialog will be closed by AlertDialogCancel or AlertDialogAction

    if (result.success) {
      toast({
        title: "Event Deleted",
        description: `The event "${eventName}" has been successfully deleted.`,
        variant: "default",
      });
      router.push('/events');
      // router.refresh(); // Not strictly necessary due to redirect and revalidatePath in action
    } else {
      toast({
        title: "Error Deleting Event",
        description: result.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setIsAlertOpen(false); // Ensure dialog closes
  };

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className={className} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the event
            <strong className="ml-1 mr-1 text-foreground">"{eventName}"</strong>
            and all of its associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isDeleting ? "Deleting..." : "Yes, delete event"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
