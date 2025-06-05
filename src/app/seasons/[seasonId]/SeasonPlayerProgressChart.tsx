'use client';

import type { PlayerProgressPoint } from '@/lib/stats-service';
import type { Player, Event as EventType } from '@/lib/definitions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as React from 'react';
import { format } from 'date-fns';

interface SeasonPlayerProgressChartProps {
  playerProgressData: { [playerId: string]: PlayerProgressPoint[] };
  players: Player[];
  seasonEvents: EventType[]; 
}

const MAX_PLAYERS_TO_DISPLAY = 6; 

const generateColor = (index: number): string => {
  const colors = [
    "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", 
    "hsl(var(--chart-4))", "hsl(var(--chart-5))", 
    "hsl(200, 70%, 50%)", "hsl(150, 60%, 45%)", "hsl(50, 80%, 55%)",
    "hsl(320, 65%, 60%)", "hsl(170, 50%, 50%)" 
  ];
  return colors[index % colors.length];
};


export default function SeasonPlayerProgressChart({ playerProgressData, players, seasonEvents }: SeasonPlayerProgressChartProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = React.useState<string[]>(() => {
    const sortedPlayerIdsByCurrentStanding = Object.keys(playerProgressData)
    .map(playerId => ({
        playerId,
        finalCumulative: playerProgressData[playerId]?.[playerProgressData[playerId].length-1]?.cumulativeFinalResult || -Infinity
    }))
    .sort((a,b) => b.finalCumulative - a.finalCumulative)
    .map(p => p.playerId);
    return sortedPlayerIdsByCurrentStanding.slice(0, MAX_PLAYERS_TO_DISPLAY);
  });

  const handlePlayerSelectionChange = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else if (prev.length < MAX_PLAYERS_TO_DISPLAY) {
        return [...prev, playerId];
      }
      return prev; 
    });
  };
  
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.nickname ? `(${player.nickname})` : player.lastName.substring(0,1)}.` : 'Unknown';
  };

  const chartData = React.useMemo(() => {
    if (seasonEvents.length === 0 || selectedPlayerIds.length === 0) return [];

    const data: any[] = [];
    // Ensure there's a starting point (0) for all selected players before the first event
    const initialDataPoint: any = {
        date: seasonEvents.length > 0 ? new Date(seasonEvents[0].date).getTime() - 86400000 : new Date().getTime() - 86400000, // One day before first event
        eventName: "Start of Season",
    };
    selectedPlayerIds.forEach(playerId => {
        initialDataPoint[getPlayerName(playerId)] = 0;
    });
    data.push(initialDataPoint);


    seasonEvents.forEach((event) => {
      const dataPoint: any = {
        date: new Date(event.date).getTime(),
        eventName: event.name, 
      };

      selectedPlayerIds.forEach(playerId => {
        const progressForPlayer = playerProgressData[playerId];
        const eventPoint = progressForPlayer?.find(p => p.eventDate === event.date);
        
        const previousPointForPlayer = data.length > 0 ? data[data.length-1][getPlayerName(playerId)] : 0;

        if (eventPoint) {
          dataPoint[getPlayerName(playerId)] = eventPoint.cumulativeFinalResult;
        } else {
          // If player didn't participate in this event, carry over their previous cumulative result for chart continuity
          dataPoint[getPlayerName(playerId)] = previousPointForPlayer;
        }
      });
      data.push(dataPoint);
    });
    return data.sort((a,b) => a.date - b.date);
  }, [playerProgressData, selectedPlayerIds, players, seasonEvents]);


  if (Object.keys(playerProgressData).length === 0) {
    return <p className="text-muted-foreground">No player progress data to display.</p>;
  }

  const participatingPlayersInSeason = players
    .filter(p => playerProgressData[p.id] && playerProgressData[p.id].length > 0)
    .sort((a,b) => a.firstName.localeCompare(b.firstName));

  return (
    <div className="space-y-6">
      <div>
        <Label className="font-medium">Select Players to Display (Max {MAX_PLAYERS_TO_DISPLAY}):</Label>
        <ScrollArea className="h-32 mt-1 rounded-md border p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {participatingPlayersInSeason.map(player => (
                <div key={player.id} className="flex items-center space-x-2">
                    <Checkbox
                    id={`player-progress-${player.id}`}
                    checked={selectedPlayerIds.includes(player.id)}
                    onCheckedChange={() => handlePlayerSelectionChange(player.id)}
                    disabled={!selectedPlayerIds.includes(player.id) && selectedPlayerIds.length >= MAX_PLAYERS_TO_DISPLAY}
                    />
                    <Label htmlFor={`player-progress-${player.id}`} className="text-sm font-normal cursor-pointer hover:text-primary">
                    {player.firstName} {player.lastName} {player.nickname ? `(${player.nickname})` : ''}
                    </Label>
                </div>
                ))}
            </div>
            {participatingPlayersInSeason.length === 0 && <p className="text-sm text-muted-foreground">No players with progress in this season.</p>}
        </ScrollArea>
      </div>

      {selectedPlayerIds.length > 0 && chartData.length > 1 ? ( // Need at least 2 points for a line
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(unixTime) => format(new Date(unixTime), 'dd/MM')}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickMargin={10}
              angle={-45}
              textAnchor="end"
              interval="preserveStartEnd" 
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11} 
              tickFormatter={(value) => `$${value}`}
              tickMargin={5}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                padding: '8px 12px',
                boxShadow: 'hsl(var(--shadow))'
              }}
              labelFormatter={(label, payload) => {
                 const point = payload?.[0]?.payload;
                 return point ? `${format(new Date(label), 'EEE, MMM d, yyyy')} - ${point.eventName}` : format(new Date(label), 'PPP');
              }}
              formatter={(value: number, name: string, props) => {
                 const eventFinal = props.payload?.eventFinalResult; // This relies on eventFinalResult being available if applicable
                 const formattedValue = `$${value.toFixed(2)}`;
                 return [formattedValue, name];
              }}
              itemSorter={(item) => -item.value!} // Sort legend items by value desc
            />
            <Legend wrapperStyle={{fontSize: '12px', paddingTop: '20px'}}/>
            {selectedPlayerIds.map((playerId, index) => (
              <Line
                key={playerId}
                type="monotone"
                dataKey={getPlayerName(playerId)}
                stroke={generateColor(index)}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 1, fill: generateColor(index) }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: generateColor(index), fill: 'hsl(var(--background))' }}
                connectNulls={true} // Important for players not in every event
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
         <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-md border border-dashed">
            <p className="text-muted-foreground text-center">
                {selectedPlayerIds.length === 0 ? "Select players to view their progress." : 
                (chartData.length <=1 ? "Not enough data points to draw a chart for selected players." : "No data to display for selected players or events.")}
            </p>
         </div>
      )}
    </div>
  );
}
