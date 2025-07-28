
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronsLeftRight } from 'lucide-react';

interface EventCarouselProps {
  seasonEvents: { id: string, name: string }[];
  currentEventId: string;
  seasonName: string;
}

export default function EventCarousel({ seasonEvents, currentEventId, seasonName }: EventCarouselProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [api, setApi] = React.useState<CarouselApi>();

  const currentEventIndex = React.useMemo(() => {
    return seasonEvents.findIndex(event => event.id === currentEventId);
  }, [seasonEvents, currentEventId]);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const handleSelect = (api: CarouselApi) => {
      const selectedIndex = api.selectedScrollSnap();
      const newEventId = seasonEvents[selectedIndex]?.id;
      if (newEventId && newEventId !== currentEventId) {
        // Prevent re-pushing the same URL
        if (pathname !== `/events/${newEventId}`) {
          router.push(`/events/${newEventId}`);
        }
      }
    };

    api.on("select", handleSelect);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api, router, seasonEvents, currentEventId, pathname]);

  if (seasonEvents.length <= 1) {
    return null; // Don't show carousel if there's only one event or none
  }

  return (
    <div className="w-full relative mb-6">
       <div className="text-center mb-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2"><ChevronsLeftRight className="h-4 w-4"/> Event Navigation: <span className="font-bold text-foreground">{seasonName}</span></p>
       </div>
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          startIndex: currentEventIndex,
          loop: true,
        }}
        className="w-full max-w-lg mx-auto"
      >
        <CarouselContent>
          {seasonEvents.map((event, index) => (
            <CarouselItem key={event.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Link href={`/events/${event.id}`} className="block">
                  <Card className={cn(
                    "transition-all",
                    index === currentEventIndex ? "border-primary shadow-lg" : "border-border/50 hover:border-primary/70 hover:shadow-md"
                  )}>
                    <CardContent className="flex items-center justify-center p-3">
                      <span className={cn(
                        "text-sm font-medium truncate text-center",
                        index === currentEventIndex ? "text-primary" : "text-foreground"
                      )}>
                        {event.name}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
