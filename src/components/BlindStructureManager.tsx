
'use client';

import React, { useState } from 'react';
import type { BlindLevel, BlindStructureTemplate } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Save, X } from 'lucide-react';
import { Switch } from './ui/switch';

interface BlindStructureManagerProps {
  isOpen: boolean;
  onClose: () => void;
  structures: BlindStructureTemplate[];
  activeStructure: BlindLevel[];
  onApplyStructure: (levels: BlindLevel[]) => void;
}

const createNewLevel = (lastLevel: number): BlindLevel => ({
  level: lastLevel + 1,
  smallBlind: 0,
  bigBlind: 0,
  ante: 0,
  duration: 20,
  isBreak: false,
});

export default function BlindStructureManager({ isOpen, onClose, structures, activeStructure, onApplyStructure }: BlindStructureManagerProps) {
  const [availableStructures, setAvailableStructures] = useState<BlindStructureTemplate[]>(structures);
  const [selectedStructureId, setSelectedStructureId] = useState<string>(structures.length > 0 ? structures[0].id : '');
  const [currentLevels, setCurrentLevels] = useState<BlindLevel[]>(activeStructure);
  const [structureName, setStructureName] = useState<string>('New Custom Structure');
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    // When the selected template changes, update the editor
    const selected = availableStructures.find(s => s.id === selectedStructureId);
    if (selected) {
      setCurrentLevels(JSON.parse(JSON.stringify(selected.levels))); // Deep copy
      setStructureName(selected.name);
      setIsEditing(true);
    } else {
      // Create new
      setCurrentLevels([createNewLevel(0)]);
      setStructureName('New Custom Structure');
      setIsEditing(false);
    }
  }, [selectedStructureId, availableStructures]);

  const handleLevelChange = (index: number, field: keyof BlindLevel, value: string | number | boolean) => {
    const updatedLevels = [...currentLevels];
    const levelToUpdate = { ...updatedLevels[index] };

    if (field === 'isBreak' && typeof value === 'boolean') {
        levelToUpdate[field] = value;
        if(value) {
            levelToUpdate.smallBlind = 0;
            levelToUpdate.bigBlind = 0;
            levelToUpdate.ante = 0;
        }
    } else if (typeof value === 'string') {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            (levelToUpdate as any)[field] = numValue;
        }
    }

    updatedLevels[index] = levelToUpdate;
    setCurrentLevels(updatedLevels);
  };

  const addLevel = () => {
    const lastLevel = currentLevels.reduce((max, l) => !l.isBreak && l.level > max ? l.level : max, 0);
    setCurrentLevels([...currentLevels, createNewLevel(lastLevel)]);
  };

  const removeLevel = (index: number) => {
    setCurrentLevels(currentLevels.filter((_, i) => i !== index));
  };

  const handleSaveStructure = async () => {
    // This would call a server action to save the structure
    console.log("Saving structure:", { id: isEditing ? selectedStructureId : crypto.randomUUID(), name: structureName, levels: currentLevels });
    // For now, let's just log it and update local state
    const newStructure: BlindStructureTemplate = {
        id: isEditing ? selectedStructureId : crypto.randomUUID(),
        name: structureName,
        levels: currentLevels
    };

    if (isEditing) {
        setAvailableStructures(availableStructures.map(s => s.id === newStructure.id ? newStructure : s));
    } else {
        setAvailableStructures([...availableStructures, newStructure]);
        setSelectedStructureId(newStructure.id);
    }
    
    // Apply the newly saved structure to the timer
    onApplyStructure(newStructure.levels);
    
    alert('Structure saved (locally for now)!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Blind Structure Manager</DialogTitle>
          <DialogDescription>
            Create, view, and modify blind structures. Saved structures can be applied to any event.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-grow min-h-0">
            {/* Top Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                    <Label>Load or Edit Structure</Label>
                    <Select value={selectedStructureId} onValueChange={setSelectedStructureId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a structure..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableStructures.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-grow">
                    <Label>Structure Name</Label>
                    <Input id="structureName" value={structureName} onChange={(e) => setStructureName(e.target.value)} />
                </div>
                 <div className="self-end">
                    <Button variant="outline" onClick={() => setSelectedStructureId(crypto.randomUUID())}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create New
                    </Button>
                </div>
            </div>

            {/* Structure Editor */}
            <div className="flex flex-col gap-4 flex-grow min-h-0">
                <Label>Levels</Label>
                <ScrollArea className="border rounded-md flex-grow">
                    <Table>
                    <TableHeader className="sticky top-0 bg-muted">
                        <TableRow>
                        <TableHead className="w-[80px]">Level</TableHead>
                        <TableHead>Small</TableHead>
                        <TableHead>Big</TableHead>
                        <TableHead>Ante</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Break</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentLevels.map((level, index) => (
                        <TableRow key={index}>
                            <TableCell>
                               <Input type="number" value={level.isBreak ? 'Break' : level.level} onChange={e => handleLevelChange(index, 'level', e.target.value)} disabled={level.isBreak} className="h-8"/>
                            </TableCell>
                             <TableCell>
                                <Input type="number" value={level.smallBlind} onChange={e => handleLevelChange(index, 'smallBlind', e.target.value)} disabled={level.isBreak} className="h-8"/>
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={level.bigBlind} onChange={e => handleLevelChange(index, 'bigBlind', e.target.value)} disabled={level.isBreak} className="h-8"/>
                            </TableCell>
                             <TableCell>
                                <Input type="number" value={level.ante || ''} onChange={e => handleLevelChange(index, 'ante', e.target.value)} disabled={level.isBreak} className="h-8"/>
                            </TableCell>
                            <TableCell>
                                <Input type="number" value={level.duration} onChange={e => handleLevelChange(index, 'duration', e.target.value)} className="h-8"/>
                            </TableCell>
                             <TableCell>
                                <Switch checked={level.isBreak} onCheckedChange={value => handleLevelChange(index, 'isBreak', value)} />
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeLevel(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </ScrollArea>
                <Button variant="outline" onClick={addLevel}><PlusCircle className="mr-2 h-4 w-4" /> Add Level</Button>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSaveStructure}><Save className="mr-2 h-4 w-4"/> Save Structure</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
