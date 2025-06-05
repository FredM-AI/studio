import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlayers } from "@/lib/data-service";
import type { Player } from "@/lib/definitions";
import { PlusCircle, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";

export default async function PlayersPage() {
  const players: Player[] = await getPlayers();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Players</h1>
        <Button asChild>
          <Link href="/players/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Player
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Directory</CardTitle>
          <CardDescription>View and manage all registered players.</CardDescription>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-lg">No players found.</p>
              <p className="mt-2">Get started by adding a new player.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Nickname</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Games Played</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.firstName} {player.lastName}</TableCell>
                    <TableCell>{player.nickname || "-"}</TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>{player.stats.gamesPlayed}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        player.isActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' 
                          : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                      }`}>
                        {player.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="icon" asChild title="View Player">
                         <Link href={`/players/${player.id}`}>
                           <Eye className="h-4 w-4" />
                         </Link>
                       </Button>
                       <Button variant="outline" size="icon" asChild title="Edit Player">
                         <Link href={`/players/${player.id}/edit`}>
                           <Edit className="h-4 w-4" />
                         </Link>
                       </Button>
                       {/* Delete functionality will be added with a form/server action */}
                       <Button variant="destructive" size="icon" title="Delete Player" disabled>
                         <Trash2 className="h-4 w-4" />
                       </Button>
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
