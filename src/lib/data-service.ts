import fs from 'fs/promises';
import path from 'path';
import type { Player, Event, Season, AppSettings } from './definitions';

const dataDir = path.join(process.cwd(), 'src', 'data');

async function readFileData<T>(fileName: string, defaultValue: T): Promise<T> {
  const filePath = path.join(dataDir, fileName);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with default value
      await fs.mkdir(dataDir, { recursive: true }); // Ensure data directory exists
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    console.error(`Error reading file ${fileName}:`, error);
    throw new Error(`Could not read data from ${fileName}`);
  }
}

async function writeFileData<T>(fileName: string, data: T): Promise<void> {
  const filePath = path.join(dataDir, fileName);
  try {
    await fs.mkdir(dataDir, { recursive: true }); // Ensure data directory exists
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing file ${fileName}:`, error);
    throw new Error(`Could not write data to ${fileName}`);
  }
}

// Player data functions
export const getPlayers = (): Promise<Player[]> => readFileData<Player[]>('players.json', []);
export const savePlayers = (players: Player[]): Promise<void> => writeFileData<Player[]>('players.json', players);

// Event data functions
export const getEvents = (): Promise<Event[]> => readFileData<Event[]>('events.json', []);
export const saveEvents = (events: Event[]): Promise<void> => writeFileData<Event[]>('events.json', events);

// Season data functions
export const getSeasons = (): Promise<Season[]> => readFileData<Season[]>('seasons.json', []);
export const saveSeasons = (seasons: Season[]): Promise<void> => writeFileData<Season[]>('seasons.json', seasons);

// Settings data functions
export const getSettings = (): Promise<AppSettings> => readFileData<AppSettings>('settings.json', { theme: 'light', defaultBuyIn: 50, defaultMaxPlayers: 90 });
export const saveSettings = (settings: AppSettings): Promise<void> => writeFileData<AppSettings>('settings.json', settings);
