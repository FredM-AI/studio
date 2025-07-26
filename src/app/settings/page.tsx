
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlindStructures } from '@/lib/data-service';
import BlindStructureManager from '@/components/BlindStructureManager';

export default async function SettingsPage() { 
  const blindStructures = await getBlindStructures();

  return (
    <div className="space-y-8">
      <div className="text-left">
        <h1 className="font-headline text-3xl font-bold text-foreground">Settings</h1> 
        <p className="text-muted-foreground mt-2">
          Manage application-wide settings and presets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blind Structure Management</CardTitle>
          <CardDescription>Create, edit, and manage blind structure templates that can be used for any event.</CardDescription>
        </CardHeader>
        <CardContent>
          <BlindStructureManager 
            structures={blindStructures}
            onApplyStructure={() => {
              // This component is now being used as a page-level manager.
              // The onApplyStructure prop is less relevant here but kept for component reuse.
              // In a more complex scenario, this could trigger a UI update.
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
