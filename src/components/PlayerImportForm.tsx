
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { importPlayersFromJson, type PlayerImportFormState } from '@/app/players/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';

export default function PlayerImportForm() {
  const initialState: PlayerImportFormState = { message: null, errors: {}, successCount: 0, skippedCount: 0 };
  const [state, dispatch] = useActionState(importPlayersFromJson, initialState);
  const [fileContent, setFileContent] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
      };
      reader.onerror = () => {
        // Reset state and show an error for file reading
        setFileContent(null);
        setFileName('');
        // This error won't go through `useActionState`, so handle it directly or set a local error state
        console.error("Error reading file."); 
      };
      reader.readAsText(file);
    } else {
      setFileContent(null);
      setFileName('');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileContent) {
      // Handle case where no file is selected or content is null
      // Potentially set a local error message here
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('jsonContent', fileContent);
    await dispatch(formData); // `dispatch` is already async-aware from `useActionState`
    setIsSubmitting(false);
    // Optionally reset file input after submission attempt
    // setFileContent(null);
    // setFileName('');
    // if (event.target instanceof HTMLFormElement) event.target.reset();
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <UploadCloud className="mr-2 h-5 w-5 text-primary" />
          Import Players from JSON
        </CardTitle>
        <CardDescription>
          Select a JSON file containing an array of players to import them into the database.
          Players with existing IDs or emails will be skipped.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jsonFile">JSON File</Label>
            <Input
              id="jsonFile"
              name="jsonFile"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              required
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {fileName && <p className="mt-1 text-xs text-muted-foreground">Selected: {fileName}</p>}
          </div>

          {state.errors?.jsonContent && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{state.errors.jsonContent.join(', ')}</p>
            </div>
          )}
          {state.errors?._form && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{state.errors._form.join(', ')}</p>
            </div>
          )}
          {state.message && !state.errors?._form && !state.errors?.jsonContent && (
             <div className={`text-sm p-2 rounded-md flex items-start gap-2 ${state.successCount !== undefined && state.successCount > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {state.successCount !== undefined && state.successCount > 0 ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> }
                <p>{state.message}</p>
             </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!fileContent || isSubmitting} className="w-full">
            {isSubmitting ? 'Importing...' : 'Import Players'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
