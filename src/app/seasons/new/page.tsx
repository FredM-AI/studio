
import SeasonForm from '@/app/seasons/SeasonForm';
import { createSeason } from '@/app/seasons/actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewSeasonPage() {
  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/seasons">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Seasons
        </Link>
      </Button>
      <SeasonForm
        action={createSeason}
        formTitle="Create New Season"
        formDescription="Define a new poker season and its parameters."
        submitButtonText="Create Season"
      />
    </div>
  );
}
