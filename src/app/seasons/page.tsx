import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function SeasonsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Seasons & Leaderboards</h1>
        <Button asChild disabled>
          <Link href="/seasons/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Season
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seasons Management</CardTitle>
          <CardDescription>View and manage poker seasons and their leaderboards.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-20">
          <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-xl">Season management is coming soon!</p>
          <p className="mt-2">This section will allow you to track player performance over time.</p>
        </CardContent>
      </Card>
    </div>
  );
}
