import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-headline text-3xl font-bold">Application Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your Poker Tournament Manager experience.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-20">
           <SettingsIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-xl">Settings are coming soon!</p>
          <p className="mt-2">Here you'll be able to configure theme, default values, and more.</p>
        </CardContent>
      </Card>
    </div>
  );
}
