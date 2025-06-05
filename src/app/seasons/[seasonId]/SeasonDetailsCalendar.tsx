'use client';

import type { Event } from '@/lib/definitions';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';
import { format } from 'date-fns';
import * as React from 'react';

interface SeasonDetailsCalendarProps {
  events: Event[];
}

export default function SeasonDetailsCalendar({ events }: SeasonDetailsCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    events.length > 0 ? new Date(events[0].date) : new Date()
  );
  
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
        return new Date(year, month - 1, day); // Construct Date object correctly
    })
  };
  
  const eventDateModifierStyles = {
    eventDay: {
      fontWeight: 'bold' as React.CSSProperties['fontWeight'],
      textDecoration: 'underline',
      color: 'hsl(var(--primary))',
      position: 'relative' as React.CSSProperties['position'],
    }
  };

  const DayWithEvents = ({ date }: { date: Date }) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = eventsByDate.get(dateStr) || [];

    if (dayEvents.length === 0) {
      return <span>{format(date, 'd')}</span>;
    }
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button 
            className="w-full h-full flex items-center justify-center relative focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
            aria-label={`Events on ${format(date, 'PPP')}`}
          >
            {format(date, 'd')}
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-3.5 w-3.5 p-0 flex items-center justify-center text-[9px] leading-none">
              {dayEvents.length}
            </Badge>
          </button>
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
                    <p className="text-xs text-muted-foreground">Buy-in: ${event.buyIn.toFixed(2)}</p>
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
        selected={currentMonth} // Selected is not strictly needed for this display but DayPicker requires it for single mode
        onSelect={() => {}} // No action on select for display-only calendar
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        className="rounded-md border shadow"
        modifiers={eventDateModifiers}
        modifiersStyles={eventDateModifierStyles}
        components={{
          DayContent: DayWithEvents,
        }}
        showOutsideDays
      />
    </div>
  );
}
