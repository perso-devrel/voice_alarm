import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Alarm, Message, LibraryItem } from '../types';

const KEYS = {
  alarms: 'offline_cache_alarms',
  messages: 'offline_cache_messages',
  library: 'offline_cache_library',
} as const;

export async function cacheAlarms(alarms: Alarm[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.alarms, JSON.stringify(alarms));
}

export async function getCachedAlarms(): Promise<Alarm[] | null> {
  const raw = await AsyncStorage.getItem(KEYS.alarms);
  if (!raw) return null;
  return JSON.parse(raw) as Alarm[];
}

export async function cacheMessages(messages: Message[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.messages, JSON.stringify(messages));
}

export async function getCachedMessages(): Promise<Message[] | null> {
  const raw = await AsyncStorage.getItem(KEYS.messages);
  if (!raw) return null;
  return JSON.parse(raw) as Message[];
}

export async function cacheLibrary(items: LibraryItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.library, JSON.stringify(items));
}

export async function getCachedLibrary(): Promise<LibraryItem[] | null> {
  const raw = await AsyncStorage.getItem(KEYS.library);
  if (!raw) return null;
  return JSON.parse(raw) as LibraryItem[];
}
