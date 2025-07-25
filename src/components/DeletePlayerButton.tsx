
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
import { deletePlayer } from '@/app/players/actions';
import { useToast } from "@/hooks/use-toast";

interface DeletePlayerButtonProps {
  playerId: string;
  playerName: string;
}

export default function DeletePlayerButton({ playerId, playerName }: DeletePlayerButtonProps) {
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deletePlayer(playerId);
    setIsDeleting(false);
    
    if (result.success) {
      toast({
        title: "Player Deleted",
        description: `The player "${playerName}" has been successfully deleted.`,
        variant: "default",
      });
      // No need to manually refresh or redirect, revalidatePath in action handles it.
    } else {
      toast({
        title: "Error Deleting Player",
        description: result.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    setIsAlertOpen(false); // Close dialog on completion
  };

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" title="Delete Player" disabled={isDeleting}>
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the player
            <strong className="ml-1 mr-1 text-foreground">"{playerName}"</strong>
            and all associated data. This action is irreversible.
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
            {isDeleting ? "Deleting..." : "Yes, delete player"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
