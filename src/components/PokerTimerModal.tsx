
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Event, BlindLevel } from '@/lib/definitions';
import Draggable from 'react-draggable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, FastForward, Rewind, Settings, Volume2, Maximize } from 'lucide-react';

interface PokerTimerModalProps {
  event: Event;
  onClose: () => void;
}

const defaultBlindStructure: BlindLevel[] = [
    { level: 1, smallBlind: 10, bigBlind: 20, duration: 20, isBreak: false },
    { level: 2, smallBlind: 20, bigBlind: 40, duration: 20, isBreak: false },
    { level: 3, smallBlind: 30, bigBlind: 60, duration: 20, isBreak: false },
    { level: 4, smallBlind: 40, bigBlind: 80, duration: 20, isBreak: false },
    { level: 5, smallBlind: 50, bigBlind: 100, duration: 20, isBreak: false },
    { level: 0, smallBlind: 0, bigBlind: 0, duration: 5, isBreak: true },
    { level: 6, smallBlind: 100, bigBlind: 200, duration: 15, isBreak: false },
    { level: 7, smallBlind: 150, bigBlind: 300, duration: 15, isBreak: false },
    { level: 8, smallBlind: 200, bigBlind: 400, duration: 15, isBreak: false },
];

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function PokerTimerModal({ event, onClose }: PokerTimerModalProps) {
  const nodeRef = useRef(null);
  const [structure, setStructure] = useState<BlindLevel[]>(event.blindStructure || defaultBlindStructure);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(structure[0].duration * 60);
  const [totalTime, setTotalTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (!isPaused) {
      timerInterval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isPaused]);

  useEffect(() => {
    if (timeLeft <= 0) {
      goToNextLevel();
    }
  }, [timeLeft]);

  const goToNextLevel = () => {
    const nextLevelIndex = (currentLevelIndex + 1) % structure.length;
    setCurrentLevelIndex(nextLevelIndex);
    setTimeLeft(structure[nextLevelIndex].duration * 60);
  };

  const goToPrevLevel = () => {
    const prevLevelIndex = (currentLevelIndex - 1 + structure.length) % structure.length;
    setCurrentLevelIndex(prevLevelIndex);
    setTimeLeft(structure[prevLevelIndex].duration * 60);
  };
  
  const currentLevel = structure[currentLevelIndex];
  const nextLevel = structure[(currentLevelIndex + 1) % structure.length];

  const timeToNextBreak = () => {
    let time = 0;
    let tempIndex = currentLevelIndex;
    if (currentLevel.isBreak) return 0;

    time += timeLeft;
    tempIndex = (tempIndex + 1) % structure.length;
    while(tempIndex < structure.length && !structure[tempIndex].isBreak) {
        time += structure[tempIndex].duration * 60;
        tempIndex = (tempIndex + 1) % structure.length;
    }
    return time;
  };


  return (
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
                Next: Level {nextLevel.level}
              </div>
              <div className="text-right w-1/3">
                <p className="font-bold">{nextLevel.isBreak ? 'BREAK' : `${nextLevel.smallBlind} / ${nextLevel.bigBlind}`}</p>
                <p className="text-xs">Ante: {nextLevel.ante || '-'}</p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-6 text-sm">
                <div className="bg-black/20 p-3 rounded">
                    <h4 className="font-bold border-b border-gray-500 pb-1 mb-2">Status</h4>
                    <div className="flex justify-between"><span>Players:</span> <span>0/0</span></div>
                    <div className="flex justify-between"><span>Rebuys:</span> <span>0</span></div>
                    <div className="flex justify-between"><span>Addons:</span> <span>0</span></div>
                </div>
                 <div className="bg-black/20 p-3 rounded">
                    <h4 className="font-bold border-b border-gray-500 pb-1 mb-2">Statistics</h4>
                    <div className="flex justify-between"><span>Avg. stack:</span> <span>0</span></div>
                    <div className="flex justify-between"><span>Total chips:</span> <span>0</span></div>
                    <div className="flex justify-between"><span>Total prize:</span> <span className="font-bold">€0</span></div>
                </div>
                 <div className="bg-black/20 p-3 rounded">
                    <h4 className="font-bold border-b border-gray-500 pb-1 mb-2">Prizes</h4>
                    <div className="flex justify-between"><span>1st:</span> <span className="font-bold">€0</span></div>
                    <div className="flex justify-between"><span>2nd:</span> <span className="font-bold">€0</span></div>
                    <div className="flex justify-between"><span>3rd:</span> <span className="font-bold">€0</span></div>
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
                <Button variant="ghost" size="icon"><Settings className="h-5 w-5"/></Button>
                <Button variant="ghost" size="icon"><Maximize className="h-5 w-5"/></Button>
             </div>
          </div>
        </div>
      </div>
    </Draggable>
  );
}
