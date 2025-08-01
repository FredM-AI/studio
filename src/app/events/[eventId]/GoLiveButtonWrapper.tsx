
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlayCircle, Loader2 } from 'lucide-react';
import { goLiveFromDetails } from '@/app/events/actions';

export default function GoLiveButtonWrapper({ eventId, currentStatus }: { eventId: string, currentStatus: string }) {
    const [isPending, startTransition] = React.useTransition();
    const router = useRouter();
    const { toast } = useToast();

    const handleGoLive = () => {
        startTransition(async () => {
            const result = await goLiveFromDetails(eventId);
            if (result.success) {
                toast({ title: 'Success', description: 'Event is now live!' });
                router.push(`/events/${eventId}/live`);
            } else {
                toast({ title: 'Error', description: result.message, variant: 'destructive' });
            }
        });
    };
    
    if (currentStatus !== 'draft') {
        return null;
    }

    return (
        <Button onClick={handleGoLive} disabled={isPending} size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            {isPending ? 'Going Live...' : 'Go Live'}
        </Button>
    );
};
