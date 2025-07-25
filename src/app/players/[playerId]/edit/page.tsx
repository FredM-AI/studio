import PlayerForm from '@/app/players/PlayerForm';
import { updatePlayer } from '@/app/players/actions';
import { getPlayers } from '@/lib/data-service';
import type { Player } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

async function getPlayer(id: string): Promise<Player | undefined> {
  const players = await getPlayers();
  return players.find(p => p.id === id);
}

export default async function EditPlayerPage({ params }: { params: { playerId: string } }) {
  const player = await getPlayer(params.playerId);

  if (!player) {
    return (
      <div className="text-center py-10">
        <h1 className="font-headline text-2xl text-destructive">Player Not Found</h1>
        <p className="text-muted-foreground mt-2">Cannot edit a player that does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/players">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Players
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
       <Button variant="outline" asChild>
        <Link href={`/players/${player.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Player Details
        </Link>
      </Button>
      <PlayerForm 
        player={player}
        action={updatePlayer}
        formTitle="Edit Player"
        formDescription={`Update the details for ${player.firstName} ${player.lastName}.`}
        submitButtonText="Save Changes"
      />
    </div>
  );
}
