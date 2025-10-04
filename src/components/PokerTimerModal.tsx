
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Event, BlindLevel, Player } from '@/lib/definitions';
import type { ParticipantState } from './LivePlayerTracking';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Play, Pause, FastForward, Rewind, Settings, Expand, Shrink, Volume2, VolumeX, Sun, Moon, Users, RefreshCw, Crown } from 'lucide-react';
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
  activeStructure: BlindLevel[];
  allPlayers: Player[];
  availablePlayers: Player[];
  onAddParticipant: (player: Player) => void;
  onRemoveParticipant: (playerId: string) => void;
  onRebuyChange: (playerId: string, delta: number) => void;
  onBountyChange: (playerId: string, value: number) => void;
  onMysteryKoChange: (playerId: string, value: number) => void;
  onEliminatePlayer: (playerId: string) => void;
  onUndoLastElimination: () => void;
  onStructureUpdate: (newStructure: BlindLevel[]) => void;
  refreshBlindStructures: () => Promise<void>;
}

// --- Sound Bank ---
// Add your sound URLs here. A random one will be picked for each level-end alert.
const soundBank: string[] = [
  'https://universal-soundbank.com/sounds/22459.mp3',
  'https://universal-soundbank.com/sounds/12680.mp3',
  'https://universal-soundbank.com/sounds/12556.mp3',
  'https://universal-soundbank.com/sounds/3238.mp3',
  'https://universal-soundbank.com/sounds/11895.mp3',
  'https://universal-soundbank.com/sounds/1097.mp3',
  'https://universal-soundbank.com/sounds/7367.mp3',
  'https://universal-soundbank.com/sounds/2500.mp3',
  'https://universal-soundbank.com/sounds/2335.mp3',
];
// --- End of Sound Bank ---


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
    activeStructure: initialActiveStructure, 
    allPlayers,
    availablePlayers,
    onAddParticipant,
    onRemoveParticipant,
    onRebuyChange,
    onBountyChange,
    onMysteryKoChange,
    onEliminatePlayer,
    onUndoLastElimination,
    onStructureUpdate,
    refreshBlindStructures,
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
  
  const [activeStructure, setActiveStructure] = useState<BlindLevel[]>(initialActiveStructure);
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

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    // Propagate structure changes up to the parent `LiveTournamentClient`
    onStructureUpdate(activeStructure);
  }, [activeStructure, onStructureUpdate]);

  useEffect(() => {
    // This effect handles "hot-reloading" the structure from the parent
    const savedLevelIndex = getInitialState(`${timerStorageKey}-level`, 0);
    const savedTimeLeft = getInitialState(`${timerStorageKey}-time`, undefined);

    setActiveStructure(initialActiveStructure);
    setCurrentLevelIndex(savedLevelIndex);
    
    const newDuration = initialActiveStructure[savedLevelIndex]?.duration * 60;

    if(savedTimeLeft !== undefined) {
        if (savedTimeLeft > newDuration) {
            setTimeLeft(newDuration);
        } else {
            setTimeLeft(savedTimeLeft);
        }
    } else {
        setTimeLeft(newDuration);
    }

  }, [initialActiveStructure, timerStorageKey]);


  useEffect(() => {
    if(audioRef.current) {
        audioRef.current.volume = settings.volume;
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
    if(settings.soundEnabled && audioRef.current && soundBank.length > 0) {
        const randomIndex = Math.floor(Math.random() * soundBank.length);
        const randomSoundSrc = soundBank[randomIndex];
        audioRef.current.src = randomSoundSrc;
        audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
  }

  const goToNextLevel = (playSound = false) => {
    if (activeStructure.length === 0 || currentLevelIndex >= activeStructure.length - 1) {
        // We are at the last level, so we stop the timer.
        setIsPaused(true);
        setTimeLeft(0);
        if (playSound) playLevelEndSound();
        return;
    }
    if (playSound) playLevelEndSound();
    const nextLevelIndex = currentLevelIndex + 1;
    setCurrentLevelIndex(nextLevelIndex);
    setTimeLeft(activeStructure[nextLevelIndex].duration * 60);
  };

  const goToPrevLevel = () => {
    if (activeStructure.length === 0) return;
    const prevLevelIndex = Math.max(0, currentLevelIndex - 1);
    setCurrentLevelIndex(prevLevelIndex);
    setTimeLeft(activeStructure[prevLevelIndex].duration * 60);
  };
  
 const toggleFullScreen = () => {
    const contentElement = modalRef.current;
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
  
  const isLastLevel = safeCurrentLevelIndex >= activeStructure.length - 1;
  const nextLevel = isLastLevel ? currentLevel : activeStructure[safeCurrentLevelIndex + 1];

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
  
  const { totalPrizePool, payoutStructure } = React.useMemo(() => {
    const numParticipants = participants.length;
    const calculatedPrizePool = (numParticipants * (event.buyIn || 0)) + (totalRebuys * (event.rebuyPrice || 0));
    
    const structure: { position: number, prize: number }[] = [];
    if (numParticipants > 0 && calculatedPrizePool > 0) {
      if (numParticipants < 14) {
        if (numParticipants >= 3) {
          structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.50) });
          structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.30) });
          structure.push({ position: 3, prize: Math.round(calculatedPrizePool * 0.20) });
        } else if (numParticipants === 2) {
          structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.65) });
          structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.35) });
        } else {
          structure.push({ position: 1, prize: calculatedPrizePool });
        }
      } else {
        const fourthPrize = event.buyIn || 0;
        if (calculatedPrizePool > fourthPrize) {
          const remainingPool = calculatedPrizePool - fourthPrize;
          structure.push({ position: 1, prize: Math.round(remainingPool * 0.50) });
          structure.push({ position: 2, prize: Math.round(remainingPool * 0.30) });
          structure.push({ position: 3, prize: Math.round(remainingPool * 0.20) });
          structure.push({ position: 4, prize: fourthPrize });
        } else {
          structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.50) });
          structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.30) });
          structure.push({ position: 3, prize: Math.round(calculatedPrizePool * 0.20) });
        }
      }
    }
    return { totalPrizePool: calculatedPrizePool, payoutStructure: structure.sort((a,b) => a.position - b.position) };
  }, [participants, totalRebuys, event.buyIn, event.rebuyPrice]);


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
            else {
              onOpenChange(false);
            }
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Poker Timer: {event.name}</DialogTitle>
          <DialogDescription>Live management interface for the poker tournament, including blinds, timer, and player tracking.</DialogDescription>
        </DialogHeader>
        
        <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
            <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="timer-header-button h-7 w-7 text-gray-400 hover:text-white">
                {isFullScreen ? <Shrink className="h-5 w-5"/> : <Expand className="h-5 w-5"/>}
            </Button>
             <DialogClose asChild>
                <Button variant="ghost" size="icon" className="timer-header-button h-7 w-7 text-gray-400 hover:text-white">
                    <X className="h-5 w-5"/>
                    <span className="sr-only">Close</span>
                </Button>
            </DialogClose>
        </div>


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
            <div className="flex-1 flex gap-6 items-center">
                <Button variant="ghost" size="icon" onClick={refreshBlindStructures} className="timer-header-button h-7 w-7 text-gray-400 hover:text-white">
                    <RefreshCw className="h-5 w-5"/>
                </Button>
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
          </header>
          
          <div className="timer-sticky-content">
            <div className="w-full h-full flex flex-row items-center gap-8">
              {/* Left Column: Timer */}
              <div className="flex-grow flex flex-col justify-center h-full">
                  <div className="timer-display-area">
                      <div className="timer-countdown">
                      {formatTime(timeLeft)}
                      </div>
                      <div className="timer-blinds-area">
                      <p className="timer-blinds-label">Blinds</p>
                      <p className="timer-blinds-value">
                          {currentLevel.isBreak ? 'BREAK' : `${currentLevel.smallBlind} / ${currentLevel.bigBlind}`}
                      </p>
                      {currentLevel.ante && currentLevel.ante > 0 && !currentLevel.isBreak && (
                        <>
                          <p className="timer-ante-label">Ante</p>
                          <p className="timer-ante-value">{currentLevel.ante}</p>
                        </>
                      )}
                      </div>
                  </div>
                  <div className="timer-next-level-bar">
                      <div className="timer-next-level-label">
                        Next: {nextLevel.isBreak ? 'Break' : `Level ${nextLevel.level}`}
                      </div>
                      <div className="timer-next-level-blinds">
                      <p className="font-bold">{nextLevel.isBreak ? 'BREAK' : `${nextLevel.smallBlind} / ${nextLevel.bigBlind}`}</p>
                      <p className="text-xs">Ante: {nextLevel.ante || '-'}</p>
                      </div>
                  </div>
              </div>
              {/* Right Column: Stats & Prize Pool */}
              <div className="flex-shrink-0 w-[350px] grid grid-cols-1 gap-4 h-full">
                <div className="timer-stats-box">
                    <h4 className="timer-stats-title">Status & Stats</h4>
                    <div className="timer-stats-row"><span>Players:</span> <span>{activeParticipants.length} / {participants.length}</span></div>
                    <div className="timer-stats-row"><span>Rebuys:</span> <span>{totalRebuys}</span></div>
                    <div className="timer-stats-row mt-2 pt-2 border-t" style={{ borderColor: 'var(--stats-border)'}}><span>Avg. stack:</span> <span>{avgStack.toLocaleString()}</span></div>
                    <div className="timer-stats-row"><span>Total chips:</span> <span>{totalChips.toLocaleString()}</span></div>
                </div>
                 <div className="timer-stats-box">
                      <h4 className="timer-stats-title">Prize Pool</h4>
                       <div className="space-y-2">
                            <div className="text-center bg-black/20 p-2 rounded-lg">
                                <p className="text-xs opacity-70 uppercase tracking-wider">Total Prize Pool</p>
                                <p className="text-2xl font-bold">€{totalPrizePool.toLocaleString()}</p>
                            </div>
                            <div>
                                {payoutStructure.length > 0 ? (
                                    <ul className="space-y-1 text-xs">
                                        {payoutStructure.map(({ position, prize }) => (
                                            <li key={position} className="flex justify-between items-center p-1 rounded">
                                                <span className="font-semibold flex items-center">
                                                  {position === 1 && <Crown className="h-4 w-4 mr-1 text-yellow-400" />}
                                                  {position}.
                                                </span>
                                                <span className="font-bold text-sm">€{prize.toLocaleString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-xs opacity-70 pt-2">Not enough players.</p>
                                )}
                            </div>
                        </div>
                </div>
              </div>
            </div>
          </div>
          

          <div className="timer-main-content">
            <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--stats-border)'}}>
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Users/> Player Tracking</h3>
                <LivePlayerTracking
                  participants={participants}
                  availablePlayers={availablePlayers}
                  onAddParticipant={onAddParticipant}
                  onRemoveParticipant={onRemoveParticipant}
                  onRebuyChange={onRebuyChange}
                  onBountyChange={onBountyChange}
                  onMysteryKoChange={onMysteryKoChange}
                  onEliminatePlayer={onEliminatePlayer}
                  onUndoLastElimination={onUndoLastElimination}
                  isModalLayout={true}
                  eventBountyValue={event.bounties}
                  eventMysteryKoValue={event.mysteryKo}
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
              <div className="flex-1 flex justify-start">
                  <div className="w-1/2 px-4">
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
