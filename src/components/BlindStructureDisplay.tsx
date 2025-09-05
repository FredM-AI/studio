
'use client';

import * as React from 'react';
import type { BlindStructureTemplate } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Eye } from 'lucide-react';
import { Badge } from './ui/badge';

interface BlindStructureDisplayProps {
  structure: BlindStructureTemplate;
}

export default function BlindStructureDisplay({ structure }: BlindStructureDisplayProps) {
  if (!structure?.levels) {
    return <span className="font-medium">N/A</span>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto font-medium">
          {structure.name}
          <Eye className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{structure.name}</DialogTitle>
          <DialogDescription>
            Starting Stack: {structure.startingStack ? structure.startingStack.toLocaleString() : 'N/A'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Lvl</TableHead>
                        <TableHead>Blinds</TableHead>
                        <TableHead>Ante</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {structure.levels.map((level, index) => (
                        <TableRow key={index}>
                            <TableCell>{level.isBreak ? <Badge variant="secondary">Break</Badge> : level.level}</TableCell>
                            <TableCell>{level.isBreak ? '-' : `${level.smallBlind}/${level.bigBlind}`}</TableCell>
                            <TableCell>{level.ante || '-'}</TableCell>
                            <TableCell className="text-right">{level.duration} min</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
