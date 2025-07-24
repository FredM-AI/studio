
'use client';

import React, { useState, useEffect } from 'react';
import { useActionState } from 'react';
import type { BlindLevel, BlindStructureTemplate } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Save, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Switch } from './ui/switch';
import { saveBlindStructureAction, type BlindStructureFormState } from '@/app/settings/actions';
import { useToast } from '@/hooks/use-toast';
import { getBlindStructures } from '@/lib/data-service';


interface BlindStructureManagerProps {
  isOpen: boolean;
  onClose: () => void;
  structures: BlindStructureTemplate[];
  activeStructure: BlindLevel[];
  onApplyStructure: (levels: BlindLevel[], structureId: string) => void;
}

const createNewLevel = (lastLevel: number): BlindLevel => ({
  level: lastLevel + 1,
  smallBlind: 0,
  bigBlind: 0,
  ante: 0,
  duration: 20,
  isBreak: false,
});

const BLANK_STRUCTURE_ID = 'new-structure-blank';

export default function BlindStructureManager({ isOpen, onClose, structures, activeStructure, onApplyStructure }: BlindStructureManagerProps) {
  const { toast } = useToast();
  const [availableStructures, setAvailableStructures] = useState<BlindStructureTemplate[]>(structures);
  const [selectedStructureId, setSelectedStructureId] = useState<string>(structures.length > 0 ? structures[0].id : BLANK_STRUCTURE_ID);
  const [currentLevels, setCurrentLevels] = useState<BlindLevel[]>(activeStructure);
  const [structureName, setStructureName] = useState<string>('New Custom Structure');
  const [startingStack, setStartingStack] = useState<string>('10000');
  const [formStructureId, setFormStructureId] = useState<string>(crypto.randomUUID());
  
  const formRef = React.useRef<HTMLFormElement>(null);

  const initialState: BlindStructureFormState = { message: null, errors: {}, success: false };
  const [state, formAction, isPending] = useActionState(saveBlindStructureAction, initialState);


  useEffect(() => {
    if (selectedStructureId === BLANK_STRUCTURE_ID) {
      setCurrentLevels([createNewLevel(0)]);
      setStructureName('New Custom Structure');
      setStartingStack('10000');
      setFormStructureId(crypto.randomUUID()); // Assign a new ID for a new potential structure
    } else {
      const selected = availableStructures.find(s => s.id === selectedStructureId);
      if (selected) {
        setCurrentLevels(JSON.parse(JSON.stringify(selected.levels))); // Deep copy
        setStructureName(selected.name);
        setStartingStack(selected.startingStack?.toString() || '10000');
        setFormStructureId(selected.id);
      }
    }
  }, [selectedStructureId, availableStructures]);

  useEffect(() => {
    if (state.message) {
      if(state.success && state.newStructure) {
        toast({ title: 'Success', description: state.message, variant: 'default' });
        // Refresh structures list from server to get the most up-to-date list
        getBlindStructures().then(updatedStructures => {
            setAvailableStructures(updatedStructures);
            // If we just created a new structure, select it.
            if(selectedStructureId === BLANK_STRUCTURE_ID && state.newStructure) {
                setSelectedStructureId(state.newStructure.id);
                setFormStructureId(state.newStructure.id);
            }
        });
      } else if (!state.success) {
        toast({ title: 'Error', description: state.message, variant: 'destructive' });
      }
    }
  }, [state, toast]);

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
        } else if(value === '') {
            (levelToUpdate as any)[field] = 0; // Set to 0 if input is cleared
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
  
  const handleApply = () => {
    onApplyStructure(currentLevels, formStructureId);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Blind Structure Manager</DialogTitle>
          <DialogDescription>
            Create, view, and modify blind structures. Saved structures can be applied to any event.
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} ref={formRef} className="flex flex-col gap-4 flex-grow min-h-0">
          <input type="hidden" name="id" value={formStructureId} />
          <input type="hidden" name="levels" value={JSON.stringify(currentLevels)} />

          {/* Top Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
             <div className="flex-grow sm:col-span-1">
              <Label>Load or Edit Structure</Label>
              <Select value={selectedStructureId} onValueChange={setSelectedStructureId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a structure..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BLANK_STRUCTURE_ID}>-- Create New Structure --</SelectItem>
                  {availableStructures.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow sm:col-span-1">
              <Label htmlFor="structureName">Structure Name</Label>
              <Input id="structureName" name="name" value={structureName} onChange={(e) => setStructureName(e.target.value)} />
               {state.errors?.name && <p className="text-xs text-destructive mt-1">{state.errors.name.join(', ')}</p>}
            </div>
            <div className="flex-grow sm:col-span-1">
                <Label htmlFor="startingStack">Starting Stack</Label>
                <Input id="startingStack" name="startingStack" type="number" value={startingStack} onChange={e => setStartingStack(e.target.value)} />
                {state.errors?.startingStack && <p className="text-xs text-destructive mt-1">{state.errors.startingStack.join(', ')}</p>}
            </div>
          </div>

          {/* Structure Editor */}
          <div className="flex flex-col gap-2 flex-grow min-h-0">
            <Label>Levels</Label>
             {state.errors?.levels && <p className="text-xs text-destructive">{state.errors.levels.join(', ')}</p>}
            <ScrollArea className="border rounded-md flex-grow">
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                  <TableRow>
                    <TableHead className="w-[80px]">Level</TableHead>
                    <TableHead>Small</TableHead>
                    <TableHead>Big</TableHead>
                    <TableHead>Ante</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-[80px]">Break</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentLevels.map((level, index) => (
                    <TableRow key={index}>
                      <TableCell>
                         <Input type="text" value={level.isBreak ? 'Break' : level.level} onChange={e => handleLevelChange(index, 'level', e.target.value)} disabled={level.isBreak} className="h-8 text-center"/>
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
                       <TableCell className="text-center">
                          <Switch checked={level.isBreak} onCheckedChange={value => handleLevelChange(index, 'isBreak', value)} />
                      </TableCell>
                      <TableCell>
                          <Button variant="ghost" size="icon" type="button" onClick={() => removeLevel(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
             <div className="flex-shrink-0 mt-2">
                <Button variant="outline" type="button" onClick={addLevel} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Level
                </Button>
            </div>
          </div>
       
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
              Save Structure
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
