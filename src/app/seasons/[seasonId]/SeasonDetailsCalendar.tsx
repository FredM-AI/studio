
'use client';

import type { Event } from '@/lib/definitions';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';
import { format, subMonths, startOfMonth, isFuture, isToday, isSameMonth } from 'date-fns';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { DayContentProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface SeasonDetailsCalendarProps {
  events: Event[];
}

export default function SeasonDetailsCalendar({ events }: SeasonDetailsCalendarProps) {
  const router = useRouter();

  const [currentBaseMonth, setCurrentBaseMonth] = React.useState<Date>(() => {
    const today = new Date();
    // Default to today, then check for events.
    let initialTargetMonth = today;

    const sortedEvents = [...events].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // If there are any events, base the calendar on the first event date.
    // This is much safer than complex future/past logic.
    if (sortedEvents.length > 0) {
      const firstEventDate = new Date(sortedEvents[0].date);
      // Ensure the date is valid before using it
      if (!isNaN(firstEventDate.getTime())) {
        initialTargetMonth = firstEventDate;
      }
    }
    
    // The calendar shows 2 months, so setting the month to 1 before the target
    // ensures the target month is visible on the right.
    return subMonths(startOfMonth(initialTargetMonth), 1);
  });
  
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach(event => {
      const dateStr = format(new Date(event.date), 'yyyy-MM-dd');
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(event);
    });
    return map;
  }, [events]);

  const eventDateModifiers = {
    eventDay: Array.from(eventsByDate.keys()).map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); 
    })
  };
  
  const eventDateModifierStyles = {
    eventDay: {
      fontWeight: 'bold' as React.CSSProperties['fontWeight'],
      color: 'hsl(var(--primary))',
      position: 'relative' as React.CSSProperties['position'],
    }
  };

  const DayContentWithPopover = ({ date, displayMonth }: DayContentProps) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = eventsByDate.get(dateStr) || [];
    const isOutside = !isSameMonth(date, displayMonth);

    const dayNumberText = format(date, 'd');

    const dayBaseContent = (
      <span className={cn(isOutside ? "text-muted-foreground opacity-50" : "")}>
        {dayNumberText}
      </span>
    );

    if (dayEvents.length === 0) {
      return dayBaseContent;
    }
    
    const contentWithBadge = (
      <div className={cn(
        "w-full h-full flex items-center justify-center relative",
        dayEvents.length > 1 && "cursor-pointer" // Cursor pointer for multi-event popover trigger
      )}>
        {dayNumberText}
        <Badge variant="destructive" className="absolute -top-1 -right-1 h-3.5 w-3.5 p-0 flex items-center justify-center text-[9px] leading-none">
          {dayEvents.length}
        </Badge>
      </div>
    );

    if (dayEvents.length === 1) {
      // Single event: onDayClick on Calendar handles navigation. Content just shows badge.
      // The cell will be styled by eventDay modifier.
      return contentWithBadge;
    }

    // Multiple events: use Popover, triggered by clicking the day cell content
    return (
      <Popover>
        <PopoverTrigger asChild>
          {contentWithBadge}
        </PopoverTrigger>
        <PopoverContent className="w-80 z-10">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Events on {format(date, 'PPP')}</h4>
            </div>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {dayEvents.map(event => (
                <div key={event.id} className="grid grid-cols-[25px_1fr] items-start pb-2 last:mb-0 last:pb-0">
                  <span className={`flex h-2 w-2 mt-1.5 translate-y-1 rounded-full ${
                      event.status === 'active' ? 'bg-green-500' :
                      event.status === 'completed' ? 'bg-blue-500' :
                      event.status === 'draft' ? 'bg-yellow-500' :
                      'bg-red-500'}`}/>
                  <div className="grid gap-0.5">
                    <Link href={`/events/${event.id}`} className="font-medium hover:underline text-sm leading-tight">
                        {event.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">Status: {event.status.charAt(0).toUpperCase() + event.status.slice(1)}</p>
                    <p className="text-xs text-muted-foreground">Buy-in: €{event.buyIn}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="flex justify-center">
      <Calendar
        mode="single"
        selected={undefined} // Keep selection uncontrolled or manage as needed for other features
        onSelect={() => {}} // Can be used if direct day selection styling is desired
        month={currentBaseMonth} 
        onMonthChange={setCurrentBaseMonth} 
        numberOfMonths={2}
        className="rounded-md border shadow"
        modifiers={eventDateModifiers}
        modifiersStyles={eventDateModifierStyles}
        components={{
          DayContent: DayContentWithPopover,
        }}
        onDayClick={(day, modifiersClicked, e) => {
          // Check if 'eventDay' modifier is applied to the clicked day
          // modifiersClicked.eventDay will be true if the 'eventDay' from eventDateModifiers matches
          if (modifiersClicked.eventDay) {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(dateStr) || [];
            if (dayEvents.length === 1) {
               // If the DayContent itself contains a PopoverTrigger, a click might also trigger it.
               // However, for single events, DayContentWithPopover does not render a Popover.
              router.push(`/events/${dayEvents[0].id}`);
            }
            // If dayEvents.length > 1, the Popover rendered by DayContentWithPopover handles the interaction.
          }
        }}
        showOutsideDays
      />
    </div>
  );
}
