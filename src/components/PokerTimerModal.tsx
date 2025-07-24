
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Event, BlindLevel, BlindStructureTemplate } from '@/lib/definitions';
import type { ParticipantState } from './LivePlayerTracking';
import Draggable from 'react-draggable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, FastForward, Rewind, Settings, Volume2, Maximize } from 'lucide-react';
import BlindStructureManager from './BlindStructureManager';

interface PokerTimerModalProps {
  event: Event;
  participants: ParticipantState[];
  totalPrizePool: number;
  payoutStructure: { position: number, prize: number }[];
  blindStructures: BlindStructureTemplate[];
  activeStructure: BlindLevel[];
  setActiveStructure: (structure: BlindLevel[], structureId: string) => void;
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function PokerTimerModal({ 
    event, 
    participants, 
    totalPrizePool,
    payoutStructure,
    blindStructures, 
    activeStructure, 
    setActiveStructure, 
    onClose 
}: PokerTimerModalProps) {
  const nodeRef = useRef(null);
  const [isStructureManagerOpen, setIsStructureManagerOpen] = useState(false);
  const timerStorageKey = `poker-timer-state-${event.id}`;

  const getInitialTimerState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(timerStorageKey);
      if (item) {
        const parsed = JSON.parse(item);
        return parsed[key] !== undefined ? parsed[key] : defaultValue;
      }
    } catch (e) {
      console.warn(`Error reading timer state for key ${key} from localStorage`, e);
    }
    return defaultValue;
  };
  
  const [currentLevelIndex, setCurrentLevelIndex] = useState(() => getInitialTimerState('currentLevelIndex', 0));
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = getInitialTimerState('timeLeft', undefined);
    // Ensure index is valid for activeStructure
    const safeIndex = Math.min(currentLevelIndex, activeStructure.length - 1);
    const structureDuration = activeStructure[safeIndex]?.duration * 60;
    return savedTime !== undefined ? savedTime : (structureDuration || 0);
  });
  const [totalTime, setTotalTime] = useState(() => getInitialTimerState('totalTime', 0));
  const [isPaused, setIsPaused] = useState(() => getInitialTimerState('isPaused', true));
  
  // Effect to save timer state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const timerState = { currentLevelIndex, timeLeft, totalTime, isPaused };
        window.localStorage.setItem(timerStorageKey, JSON.stringify(timerState));
      } catch (e) {
        console.error("Failed to save timer state to localStorage", e);
      }
    }
  }, [currentLevelIndex, timeLeft, totalTime, isPaused, timerStorageKey]);


  // Sync with external structure changes from parent
  useEffect(() => {
    const newStructureDuration = activeStructure[currentLevelIndex]?.duration * 60;
    if (timeLeft > newStructureDuration || currentLevelIndex >= activeStructure.length) {
       resetTimerWithNewStructure(activeStructure);
    }
  }, [activeStructure]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (!isPaused && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else if (timeLeft <= 0 && !isPaused) {
        goToNextLevel();
    }
    return () => clearInterval(timerInterval);
  }, [isPaused, timeLeft]);

  
  const resetTimerWithNewStructure = (newStructure: BlindLevel[]) => {
      const newIndex = 0;
      setCurrentLevelIndex(newIndex);
      setTimeLeft(newStructure.length > 0 ? newStructure[newIndex].duration * 60 : 0);
      setIsPaused(true);
      // We don't reset totalTime to preserve it across structure changes.
  }

  const goToNextLevel = () => {
    if (activeStructure.length === 0) return;
    const nextLevelIndex = (currentLevelIndex + 1) % activeStructure.length;
    setCurrentLevelIndex(nextLevelIndex);
    setTimeLeft(activeStructure[nextLevelIndex].duration * 60);
  };

  const goToPrevLevel = () => {
    if (activeStructure.length === 0) return;
    const prevLevelIndex = (currentLevelIndex - 1 + activeStructure.length) % activeStructure.length;
    setCurrentLevelIndex(prevLevelIndex);
    setTimeLeft(activeStructure[prevLevelIndex].duration * 60);
  };
  
  const safeCurrentLevelIndex = Math.min(currentLevelIndex, activeStructure.length - 1);
  const currentLevel = activeStructure[safeCurrentLevelIndex] || { level: 0, smallBlind: 0, bigBlind: 0, duration: 0, isBreak: true };
  const nextLevel = activeStructure.length > 1 ? activeStructure[(safeCurrentLevelIndex + 1) % activeStructure.length] : currentLevel;
  
  const activeParticipants = participants.filter(p => p.eliminatedPosition === null);
  const totalRebuys = participants.reduce((sum, p) => sum + p.rebuys, 0);

  const totalChips = (participants.length + totalRebuys) * (event.startingStack || 0);
  const avgStack = activeParticipants.length > 0 ? Math.floor(totalChips / activeParticipants.length) : 0;

  const timeToNextBreak = () => {
    if (activeStructure.length === 0 || currentLevel.isBreak) return 0;
    
    let time = timeLeft;
    let tempIndex = currentLevelIndex;
    
    // Check from current level onwards
    for(let i=0; i < activeStructure.length; i++) {
        const checkingIndex = (tempIndex + i) % activeStructure.length;
        const levelToCheck = activeStructure[checkingIndex];
        
        if (levelToCheck.isBreak) {
            // Found a break, now calculate time to it
            let timeToIt = 0;
            // Add time left in current level if it's not the break level itself
            if(i > 0) timeToIt += timeLeft;
            
            // Add duration of all levels between current and break
            for(let j=1; j < i; j++) {
                timeToIt += activeStructure[(currentLevelIndex + j) % activeStructure.length].duration * 60;
            }
            return timeToIt;
        }
    }

    return 0; // No break found in the structure
  };

  return (
    <>
    {isStructureManagerOpen && (
        <BlindStructureManager 
            isOpen={isStructureManagerOpen}
            onClose={() => setIsStructureManagerOpen(false)}
            structures={blindStructures}
            activeStructure={activeStructure}
            onApplyStructure={(newStructure, newStructureId) => {
                setActiveStructure(newStructure, newStructureId);
                resetTimerWithNewStructure(newStructure);
            }}
        />
    )}
    <Draggable nodeRef={nodeRef} handle=".drag-handle">
      <div
        ref={nodeRef}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl"
        style={{ cursor: 'move' }}
      >
        <div className="bg-gray-800 text-white rounded-xl shadow-2xl overflow-hidden border-4 border-gray-700">
          <div className="drag-handle p-4 bg-gray-900 flex justify-between items-center">
            <div className="flex gap-6 items-center">
                <div className="text-center">
                    <p className="text-xs text-gray-400">Level</p>
                    <p className="text-2xl font-bold">{currentLevel.isBreak ? 'BREAK' : currentLevel.level}</p>
                </div>
                 <div className="text-center border-l border-r border-gray-600 px-6">
                    <p className="text-xs text-gray-400">Total time</p>
                    <p className="text-2xl font-bold">{formatTime(totalTime)}</p>
                </div>
                 <div className="text-center">
                    <p className="text-xs text-gray-400">Time to break</p>
                    <p className="text-2xl font-bold">{formatTime(timeToNextBreak())}</p>
                </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="p-6 bg-gray-800/50 backdrop-blur-sm" style={{ backgroundImage: "url('/poker-table-background.webp')", backgroundSize: 'cover', backgroundBlendMode: 'overlay'}}>
             {/* Current Level Display */}
            <div className="bg-gray-200/90 text-gray-900 rounded-lg p-4 flex items-center justify-between shadow-lg mb-2">
              <div className="font-mono text-7xl font-bold tracking-tighter w-1/3">
                {formatTime(timeLeft)}
              </div>
              <div className="flex items-center gap-4 w-1/3 justify-center">
                 <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    CHIP
                 </div>
              </div>
              <div className="text-right w-1/3">
                <p className="text-sm text-gray-600">Blinds</p>
                <p className="text-4xl font-bold">
                    {currentLevel.isBreak ? 'BREAK' : `${currentLevel.smallBlind} / ${currentLevel.bigBlind}`}
                </p>
                <p className="text-sm text-gray-600 mt-1">Ante</p>
                <p className="text-2xl font-bold">{currentLevel.ante || '-'}</p>
              </div>
            </div>

            {/* Next Level Preview */}
            <div className="bg-gray-600/70 text-white rounded-lg p-2 flex items-center justify-between text-sm mt-4">
               <div className="font-mono text-xl font-bold w-1/3">
                {formatTime(nextLevel.duration * 60)}
              </div>
              <div className="w-1/3 text-center text-gray-300">
                Next: {nextLevel.isBreak ? 'Break' : `Level ${nextLevel.level}`}
              </div>
              <div className="text-right w-1/3">
                <p className="font-bold">{nextLevel.isBreak ? 'BREAK' : `${nextLevel.smallBlind} / ${nextLevel.bigBlind}`}</p>
                <p className="text-xs">Ante: {nextLevel.ante || '-'}</p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-6 text-sm">
                <div className="bg-black/20 p-3 rounded">
                    <h4 className="font-bold border-b border-gray-500 pb-1 mb-2">Status</h4>
                    <div className="flex justify-between"><span>Players:</span> <span>{activeParticipants.length} / {participants.length}</span></div>
                    <div className="flex justify-between"><span>Rebuys:</span> <span>{totalRebuys}</span></div>
                    <div className="flex justify-between"><span>Addons:</span> <span>0</span></div>
                </div>
                 <div className="bg-black/20 p-3 rounded">
                    <h4 className="font-bold border-b border-gray-500 pb-1 mb-2">Statistics</h4>
                    <div className="flex justify-between"><span>Avg. stack:</span> <span>{avgStack.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Total chips:</span> <span>{totalChips.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Total prize:</span> <span className="font-bold">€{totalPrizePool}</span></div>
                </div>
                 <div className="bg-black/20 p-3 rounded">
                    <h4 className="font-bold border-b border-gray-500 pb-1 mb-2">Prizes</h4>
                    {payoutStructure.map(p => (
                       <div className="flex justify-between" key={p.position}><span>{p.position}.</span> <span className="font-bold">€{p.prize}</span></div>
                    ))}
                    {payoutStructure.length === 0 && <p className="text-xs text-gray-400">Not enough data</p>}
                </div>
            </div>

          </div>

          <div className="p-3 bg-gray-900 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <p className="text-xs mr-2 text-gray-400">Controls:</p>
                <Button variant="ghost" size="icon" onClick={goToPrevLevel}><Rewind className="h-5 w-5"/></Button>
                 <Button variant="ghost" size="icon" onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? <Play className="h-5 w-5"/> : <Pause className="h-5 w-5"/>}
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNextLevel}><FastForward className="h-5 w-5"/></Button>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon"><Volume2 className="h-5 w-5"/></Button>
                <Button variant="ghost" size="icon" onClick={() => setIsStructureManagerOpen(true)}><Settings className="h-5 w-5"/></Button>
                <Button variant="ghost" size="icon"><Maximize className="h-5 w-5"/></Button>
             </div>
          </div>
        </div>
      </div>
    </Draggable>
    </>
  );
}
