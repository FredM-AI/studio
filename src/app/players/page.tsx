
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlayers } from "@/lib/data-service";
import type { Player } from "@/lib/definitions";
import { PlusCircle, Edit, Trash2, Eye, UploadCloud } from "lucide-react";
import Link from "next/link";
import { cookies } from 'next/headers';
import PlayerImportForm from "@/components/PlayerImportForm"; // Import the new component
import { Separator } from "@/components/ui/separator";


const AUTH_COOKIE_NAME = 'app_session_active';

const getPlayerDisplayName = (player: Player | undefined): string => {
  if (!player) return "Unknown Player";
  if (player.nickname && player.nickname.trim() !== '') {
    return player.nickname;
  }
  if (player.firstName) {
    return `${player.firstName}${player.lastName ? ' ' + player.lastName.charAt(0) + '.' : ''}`;
  }
  if (player.lastName) {
    return player.lastName;
  }
  return "Unnamed";
};

export default async function PlayersPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';
  const players: Player[] = await getPlayers();

  // Sort players: alphabetical by display name (which prioritizes nickname), with guests at the end.
  const sortedPlayers = players.sort((a, b) => {
    const aIsGuest = a.isGuest || false;
    const bIsGuest = b.isGuest || false;

    if (aIsGuest !== bIsGuest) {
      return aIsGuest ? 1 : -1;
    }
    
    return getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b));
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Players</h1>
        {isAuthenticated && (
          <Button asChild>
            <Link href="/players/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Player
            </Link>
          </Button>
        )}
      </div>

      {isAuthenticated && (
        <div className="my-6">
          <PlayerImportForm />
          <Separator className="my-8" />
        </div>
      )}


      <Card>
        <CardHeader>
          <CardTitle>Player Directory</CardTitle>
          <CardDescription>View and manage all registered players.</CardDescription>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-lg">No players found.</p>
              <p className="mt-2">
                {isAuthenticated ? "Get started by adding a new player or importing a JSON file." : "No players registered yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Full Name (for ref)</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{getPlayerDisplayName(player)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{player.firstName} {player.lastName}</TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          player.isActive 
                            ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' 
                            : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                        }`}>
                          {player.isActive ? "Active" : "Inactive"}
                        </span>
                        {player.isGuest && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100">
                            Guest
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="icon" asChild title="View Player">
                         <Link href={`/players/${player.id}`}>
                           <Eye className="h-4 w-4" />
                         </Link>
                       </Button>
                       {isAuthenticated && (
                         <>
                           <Button variant="outline" size="icon" asChild title="Edit Player">
                             <Link href={`/players/${player.id}/edit`}>
                               <Edit className="h-4 w-4" />
                             </Link>
                           </Button>
                           {/* Delete functionality will be added with a form/server action */}
                           <Button variant="destructive" size="icon" title="Delete Player" disabled>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
