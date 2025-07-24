
'use client';

import React, { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';
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

const BLANK_STRUCTURE_ID = 'new-structure-blank';

export default function BlindStructureManager({ isOpen, onClose, structures, activeStructure, onApplyStructure }: BlindStructureManagerProps) {
  const { toast } = useToast();
  const [availableStructures, setAvailableStructures] = useState<BlindStructureTemplate[]>(structures);
  const [selectedStructureId, setSelectedStructureId] = useState<string>(structures.length > 0 ? structures[0].id : BLANK_STRUCTURE_ID);
  const [currentLevels, setCurrentLevels] = useState<BlindLevel[]>(activeStructure);
  const [structureName, setStructureName] = useState<string>('New Custom Structure');
  
  const formRef = React.useRef<HTMLFormElement>(null);

  const initialState: BlindStructureFormState = { message: null, errors: {}, success: false };
  const [state, formAction, isPending] = useFormState(saveBlindStructureAction, initialState);

  useEffect(() => {
    // When the selected template changes, update the editor
    if (selectedStructureId === BLANK_STRUCTURE_ID) {
      setCurrentLevels([createNewLevel(0)]);
      setStructureName('New Custom Structure');
    } else {
      const selected = availableStructures.find(s => s.id === selectedStructureId);
      if (selected) {
        setCurrentLevels(JSON.parse(JSON.stringify(selected.levels))); // Deep copy
        setStructureName(selected.name);
      }
    }
  }, [selectedStructureId, availableStructures]);

  useEffect(() => {
    if (state.message) {
      if(state.success) {
        toast({ title: 'Success', description: state.message, variant: 'default' });
        // After successful save, we may need to refresh the list of structures if a new one was added.
        // For simplicity, we can close the dialog or rely on revalidation.
      } else {
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
  
  const structureIdForForm = selectedStructureId === BLANK_STRUCTURE_ID ? crypto.randomUUID() : selectedStructureId;

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
          <input type="hidden" name="id" value={structureIdForForm} />
          <input type="hidden" name="levels" value={JSON.stringify(currentLevels)} />

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
                  <SelectItem value={BLANK_STRUCTURE_ID}>-- Create New Structure --</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow">
              <Label htmlFor="structureName">Structure Name</Label>
              <Input id="structureName" name="name" value={structureName} onChange={(e) => setStructureName(e.target.value)} />
               {state.errors?.name && <p className="text-xs text-destructive mt-1">{state.errors.name.join(', ')}</p>}
            </div>
          </div>

          {/* Structure Editor */}
          <div className="flex flex-col gap-4 flex-grow min-h-0">
            <Label>Levels</Label>
             {state.errors?.levels && <p className="text-xs text-destructive mt-1">{state.errors.levels.join(', ')}</p>}
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
                          <Button variant="ghost" size="icon" type="button" onClick={() => removeLevel(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <Button variant="outline" type="button" onClick={addLevel}><PlusCircle className="mr-2 h-4 w-4" /> Add Level</Button>
          </div>
       
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4"/> Save Structure
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
