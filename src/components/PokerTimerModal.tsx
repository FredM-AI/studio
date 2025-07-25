
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Event, BlindLevel, Player } from '@/lib/definitions';
import type { ParticipantState } from './LivePlayerTracking';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Play, Pause, FastForward, Rewind, Settings, Expand, Shrink, Volume2, VolumeX, Sun, Moon, Users } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import LivePlayerTracking from './LivePlayerTracking';
import '@/app/poker-timer.css';

interface PokerTimerModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  event: Event;
  participants: ParticipantState[];
  totalPrizePool: number;
  payoutStructure: { position: number, prize: number }[];
  activeStructure: BlindLevel[];
  allPlayers: Player[];
  availablePlayers: Player[];
  onAddParticipant: (player: Player) => void;
  onRemoveParticipant: (playerId: string) => void;
  onRebuyChange: (playerId: string, delta: number) => void;
  onEliminatePlayer: (playerId: string) => void;
  onUndoLastElimination: () => void;
}

const formatTime = (seconds: number) => {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

type TimerSettings = {
  soundEnabled: boolean;
  volume: number;
  theme: 'dark' | 'light' | 'green';
};

export default function PokerTimerModal({ 
    isOpen,
    onOpenChange,
    event, 
    participants, 
    totalPrizePool,
    payoutStructure,
    activeStructure, 
    allPlayers,
    availablePlayers,
    onAddParticipant,
    onRemoveParticipant,
    onRebuyChange,
    onEliminatePlayer,
    onUndoLastElimination
}: PokerTimerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const timerStorageKey = `poker-timer-state-${event.id}`;
  const settingsStorageKey = `poker-timer-settings`;
  
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        return parsed !== null ? parsed : defaultValue;
      }
    } catch (e) {
      console.warn(`Error reading state for key ${key} from localStorage`, e);
    }
    return defaultValue;
  };
  
  const [currentLevelIndex, setCurrentLevelIndex] = useState(() => getInitialState(`${timerStorageKey}-level`, 0));
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedTime = getInitialState(`${timerStorageKey}-time`, undefined);
    const safeIndex = Math.min(currentLevelIndex, activeStructure.length - 1);
    const structureDuration = activeStructure.length > 0 ? activeStructure[safeIndex]?.duration * 60 : 0;
    return savedTime !== undefined ? savedTime : (structureDuration || 0);
  });
  const [totalTime, setTotalTime] = useState(() => getInitialState(`${timerStorageKey}-totalTime`, 0));
  const [isPaused, setIsPaused] = useState(() => getInitialState(`${timerStorageKey}-paused`, true));
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState<TimerSettings>(() => getInitialState(settingsStorageKey, {
    soundEnabled: true,
    volume: 0.5,
    theme: 'dark',
  }));

  const levelEndAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
       levelEndAudioRef.current = new Audio('/sounds/level-end.mp3');
    }
  }, []);

  useEffect(() => {
    if(levelEndAudioRef.current) {
        levelEndAudioRef.current.volume = settings.volume;
    }
  }, [settings.volume]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(`${timerStorageKey}-level`, JSON.stringify(currentLevelIndex));
        window.localStorage.setItem(`${timerStorageKey}-time`, JSON.stringify(timeLeft));
        window.localStorage.setItem(`${timerStorageKey}-totalTime`, JSON.stringify(totalTime));
        window.localStorage.setItem(`${timerStorageKey}-paused`, JSON.stringify(isPaused));
      } catch (e) {
        console.error("Failed to save timer state to localStorage", e);
      }
    }
  }, [currentLevelIndex, timeLeft, totalTime, isPaused, timerStorageKey]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    }
  }, [settings, settingsStorageKey]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (!isPaused && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else if (timeLeft <= 0 && !isPaused) {
        goToNextLevel(true); // Play sound on auto-advance
    }
    return () => clearInterval(timerInterval);
  }, [isPaused, timeLeft]);
  
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const playLevelEndSound = () => {
    if(settings.soundEnabled && levelEndAudioRef.current) {
        levelEndAudioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
  }

  const goToNextLevel = (playSound = false) => {
    if (activeStructure.length === 0) return;
    if (playSound) playLevelEndSound();
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
  
 const toggleFullScreen = () => {
    const contentElement = modalRef.current?.closest('[role="dialog"]');
    if (!contentElement) return;

    if (!document.fullscreenElement) {
        contentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

  const handleSettingsChange = (key: keyof TimerSettings, value: any) => {
    setSettings(prev => ({...prev, [key]: value}));
  }

  const safeCurrentLevelIndex = Math.min(currentLevelIndex, activeStructure.length - 1);
  const currentLevel = activeStructure[safeCurrentLevelIndex] || { level: 0, smallBlind: 0, bigBlind: 0, duration: 0, isBreak: true };
  const nextLevel = activeStructure.length > 1 ? activeStructure[(safeCurrentLevelIndex + 1) % activeStructure.length] : currentLevel;
  
  const activeParticipants = participants.filter(p => p.eliminatedPosition === null);
  const totalRebuys = participants.reduce((sum, p) => sum + p.rebuys, 0);

  const totalChips = (participants.length + totalRebuys) * (event.startingStack || 0);
  const avgStack = activeParticipants.length > 0 ? Math.floor(totalChips / activeParticipants.length) : 0;

  const timeToNextBreak = () => {
    if (activeStructure.length === 0 || currentLevel.isBreak) return 0;
    for(let i=0; i < activeStructure.length; i++) {
        const checkingIndex = (currentLevelIndex + i) % activeStructure.length;
        const levelToCheck = activeStructure[checkingIndex];
        if (levelToCheck.isBreak) {
            let timeToIt = (i > 0) ? timeLeft : 0;
            for(let j=1; j < i; j++) {
                timeToIt += activeStructure[(currentLevelIndex + j) % activeStructure.length].duration * 60;
            }
            return timeToIt;
        }
    }
    return 0;
  };
  
  const timerProgress = currentLevel.duration > 0 ? ((currentLevel.duration * 60 - timeLeft) / (currentLevel.duration * 60)) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={modalRef}
        className={cn(
          "poker-timer-modal resizable-dialog",
          `theme-${settings.theme}`,
          "max-w-7xl h-[90vh] flex flex-col p-0 gap-0"
        )}
        data-fullscreen={isFullScreen}
        onEscapeKeyDown={(e) => {
            if (isFullScreen) {
                e.preventDefault();
                toggleFullScreen();
            }
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Poker Timer: {event.name}</DialogTitle>
          <DialogDescription>Live management interface for the poker tournament, including blinds, timer, and player tracking.</DialogDescription>
        </DialogHeader>

        <div className={cn("poker-timer-content-wrapper")}>
          <div className={cn("settings-panel", { 'is-open': isSettingsOpen })}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="settings-title">Settings</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)} className="no-drag h-7 w-7">
                    <X className="h-5 w-5"/>
                </Button>
            </div>
            <div className="setting-item">
                <Label htmlFor="sound-switch">Sound Alerts</Label>
                <Switch id="sound-switch" checked={settings.soundEnabled} onCheckedChange={(val) => handleSettingsChange('soundEnabled', val)} />
            </div>
              <div className="setting-item">
                <Label htmlFor="volume-slider">Volume</Label>
                <Slider id="volume-slider" min={0} max={1} step={0.1} value={[settings.volume]} onValueChange={(val) => handleSettingsChange('volume', val[0])} />
            </div>
            <div className="setting-item">
                <Label>Theme</Label>
                <RadioGroup value={settings.theme} onValueChange={(val) => handleSettingsChange('theme', val as any)} className="flex gap-2">
                    <Label htmlFor="theme-dark" className="theme-option theme-dark-option"><RadioGroupItem value="dark" id="theme-dark"/><Sun className="h-4 w-4"/></Label>
                    <Label htmlFor="theme-light" className="theme-option theme-light-option"><RadioGroupItem value="light" id="theme-light" /><Moon className="h-4 w-4"/></Label>
                    <Label htmlFor="theme-green" className="theme-option theme-green-option"><RadioGroupItem value="green" id="theme-green" /></Label>
                </RadioGroup>
            </div>
          </div>

          <header className="drag-handle timer-header">
            <div className="flex gap-6 items-center">
                <div className="text-center">
                    <p className="timer-header-label">Level</p>
                    <p className="timer-header-value">{currentLevel.isBreak ? 'BREAK' : currentLevel.level}</p>
                </div>
                  <div className="timer-header-divider">
                    <p className="timer-header-label">Total time</p>
                    <p className="timer-header-value">{formatTime(totalTime)}</p>
                </div>
                  <div className="text-center">
                    <p className="timer-header-label">Time to break</p>
                    <p className="timer-header-value">{formatTime(timeToNextBreak())}</p>
                </div>
            </div>
            <div className="flex items-center no-drag">
              <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="timer-header-button">
                  {isFullScreen ? <Shrink className="h-5 w-5"/> : <Expand className="h-5 w-5"/>}
              </Button>
            </div>
          </header>
          
          <div className="timer-sticky-content">
              <div className="w-[70%] mx-auto flex flex-col h-full justify-center">
                  <div className="timer-display-area">
                      <div className="timer-countdown">
                      {formatTime(timeLeft)}
                      </div>
                      <div className="timer-blinds-area">
                      <p className="timer-blinds-label">Blinds</p>
                      <p className="timer-blinds-value">
                          {currentLevel.isBreak ? 'BREAK' : `${currentLevel.smallBlind} / ${currentLevel.bigBlind}`}
                      </p>
                      <p className="timer-ante-label">Ante</p>
                      <p className="timer-ante-value">{currentLevel.ante || '-'}</p>
                      </div>
                  </div>
                  <div className="timer-next-level-bar">
                      <div className="timer-next-level-time">
                      {nextLevel.duration ? formatTime(nextLevel.duration * 60) : '00:00'}
                      </div>
                      <div className="timer-next-level-label">
                      Next: {nextLevel.isBreak ? 'Break' : `Level ${nextLevel.level}`}
                      </div>
                      <div className="timer-next-level-blinds">
                      <p className="font-bold">{nextLevel.isBreak ? 'BREAK' : `${nextLevel.smallBlind} / ${nextLevel.bigBlind}`}</p>
                      <p className="text-xs">Ante: {nextLevel.ante || '-'}</p>
                      </div>
                  </div>
              </div>
          </div>
          

          <div className="timer-main-content">
            <div className="timer-stats-grid">
                <div className="timer-stats-box">
                    <h4 className="timer-stats-title">Status</h4>
                    <div className="timer-stats-row"><span>Players:</span> <span>{activeParticipants.length} / {participants.length}</span></div>
                    <div className="timer-stats-row"><span>Rebuys:</span> <span>{totalRebuys}</span></div>
                    <div className="timer-stats-row"><span>Addons:</span> <span>0</span></div>
                </div>
                  <div className="timer-stats-box">
                    <h4 className="timer-stats-title">Statistics</h4>
                    <div className="timer-stats-row"><span>Avg. stack:</span> <span>{avgStack.toLocaleString()}</span></div>
                    <div className="timer-stats-row"><span>Total chips:</span> <span>{totalChips.toLocaleString()}</span></div>
                    <div className="timer-stats-row"><span>Total prize:</span> <span className="font-bold">€{totalPrizePool}</span></div>
                </div>
                  <div className="timer-stats-box">
                    <h4 className="timer-stats-title">Prizes</h4>
                    {payoutStructure.map(p => (
                        <div className="timer-stats-row" key={p.position}><span>{p.position}.</span> <span className="font-bold">€{p.prize}</span></div>
                    ))}
                    {payoutStructure.length === 0 && <p className="text-xs text-gray-400">Not enough data</p>}
                </div>
            </div>
            
            <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--stats-border)'}}>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Users/> Player Tracking</h3>
                <LivePlayerTracking
                  allPlayers={allPlayers}
                  participants={participants}
                  availablePlayers={availablePlayers}
                  onAddParticipant={onAddParticipant}
                  onRemoveParticipant={onRemoveParticipant}
                  onRebuyChange={onRebuyChange}
                  onEliminatePlayer={onEliminatePlayer}
                  onUndoLastElimination={onUndoLastElimination}
                  isModalLayout={true}
                />
            </div>

          </div>

          <footer className="timer-footer no-drag">
              <div className="flex items-center gap-4">
                <p className="text-xs mr-2 text-gray-400">Level</p>
                  <Button variant="ghost" size="icon" onClick={() => goToPrevLevel()} className="timer-control-button"><Rewind className="h-5 w-5"/></Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsPaused(!isPaused)} className="timer-control-button">
                    {isPaused ? <Play className="h-5 w-5"/> : <Pause className="h-5 w-5"/>}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => goToNextLevel(false)} className="timer-control-button"><FastForward className="h-5 w-5"/></Button>
              </div>
              <div className="timer-progress-slider">
                <Slider 
                    value={[timerProgress]} 
                    max={100} 
                    step={1} 
                    onValueChange={(value) => {
                        const newTime = Math.round((currentLevel.duration * 60) * (1 - value[0] / 100));
                        setTimeLeft(newTime);
                    }}
                  />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="timer-control-button">
                  <Settings className="h-5 w-5"/>
                </Button>
              </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
