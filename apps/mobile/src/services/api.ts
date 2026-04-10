import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  VoiceProfile,
  Message,
  Alarm,
  Friend,
  PendingFriendRequest,
  Gift,
  LibraryItem,
  Speaker,
} from '../types';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:8787' : 'https://voice-alarm-api.your-name.workers.dev');

const BASE = `${API_BASE_URL}/api`;
const TIMEOUT_MS = 60000;

interface RequestConfig {
  method: string;
  path: string;
  body?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public responseData: unknown,
  ) {
    super(`API Error ${status}`);
    this.name = 'ApiError';
  }
}

async function request<T>(config: RequestConfig): Promise<T> {
  const token = await AsyncStorage.getItem('auth_token');

  const headers: Record<string, string> = { ...config.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!config.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  let url = `${BASE}${config.path}`;
  if (config.params) {
    const qs = new URLSearchParams(config.params).toString();
    if (qs) url += `?${qs}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: config.method,
      headers,
      body: config.isFormData
        ? (config.body as FormData)
        : config.body != null
          ? JSON.stringify(config.body)
          : undefined,
      signal: controller.signal,
    });

    if (res.status === 401) {
      await AsyncStorage.removeItem('auth_token');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new ApiError(res.status, errData);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  return request({ method: 'GET', path, params });
}

function post<T>(
  path: string,
  body?: unknown,
  opts?: { isFormData?: boolean; headers?: Record<string, string> },
): Promise<T> {
  return request({ method: 'POST', path, body, ...opts });
}

function patch<T>(path: string, body?: unknown): Promise<T> {
  return request({ method: 'PATCH', path, body });
}

function del<T>(path: string): Promise<T> {
  return request({ method: 'DELETE', path });
}

// ===== Voice Profile API =====

export async function getVoiceProfiles() {
  const data = await get<{ profiles: VoiceProfile[] }>('/voice');
  return data.profiles;
}

export async function getVoiceProfile(id: string) {
  const data = await get<{ profile: VoiceProfile }>(`/voice/${id}`);
  return data.profile;
}

export async function createVoiceClone(
  audioFile: { uri: string; name: string; type: string },
  name: string,
  provider: 'perso' | 'elevenlabs' = 'perso',
) {
  const formData = new FormData();
  formData.append('audio', audioFile as unknown as Blob);
  formData.append('name', name);
  formData.append('provider', provider);

  const data = await post<{ profile: VoiceProfile }>('/voice/clone', formData, {
    isFormData: true,
  });
  return data.profile;
}

export async function diarizeAudio(audioFile: { uri: string; name: string; type: string }) {
  const formData = new FormData();
  formData.append('audio', audioFile as unknown as Blob);

  const data = await post<{ speakers: Speaker[] }>('/voice/diarize', formData, {
    isFormData: true,
  });
  return data.speakers;
}

export async function deleteVoiceProfile(id: string) {
  await del(`/voice/${id}`);
}

// ===== TTS API =====

export async function generateTTS(params: {
  voice_profile_id: string;
  text: string;
  category?: string;
  speed?: number;
  pitch?: number;
  provider?: 'perso' | 'elevenlabs';
}) {
  return post<{
    message_id: string;
    audio_base64: string;
    audio_format: string;
    text: string;
    voice_profile_id: string;
  }>('/tts/generate', params);
}

export async function getMessages(category?: string) {
  const params = category ? { category } : undefined;
  const data = await get<{ messages: Message[] }>('/tts/messages', params);
  return data.messages;
}

export async function getPresets() {
  const data = await get<{ presets: Message[] }>('/tts/presets');
  return data.presets;
}

// ===== Alarm API =====

export async function getAlarms() {
  const data = await get<{ alarms: Alarm[] }>('/alarm');
  return data.alarms;
}

export async function createAlarm(params: {
  message_id: string;
  time: string;
  repeat_days?: number[];
  snooze_minutes?: number;
  target_user_id?: string;
}) {
  const data = await post<{ alarm: Alarm }>('/alarm', params);
  return data.alarm;
}

export async function updateAlarm(
  id: string,
  params: {
    time?: string;
    repeat_days?: number[];
    is_active?: boolean;
    snooze_minutes?: number;
    message_id?: string;
  },
) {
  await patch(`/alarm/${id}`, params);
}

export async function deleteAlarm(id: string) {
  await del(`/alarm/${id}`);
}

// ===== Friend API =====

export async function sendFriendRequest(email: string) {
  const data = await post<{ friendship: Friend }>('/friend', { email });
  return data.friendship;
}

export async function getFriendList() {
  const data = await get<{ friends: Friend[] }>('/friend/list');
  return data.friends;
}

export async function getPendingRequests() {
  const data = await get<{ pending: PendingFriendRequest[] }>('/friend/pending');
  return data.pending;
}

export async function acceptFriendRequest(id: string) {
  await patch(`/friend/${id}/accept`);
}

export async function deleteFriend(id: string) {
  await del(`/friend/${id}`);
}

// ===== Gift API =====

export async function sendGift(params: {
  recipient_email: string;
  message_id: string;
  note?: string;
}) {
  const data = await post<{ gift: Gift }>('/gift', params);
  return data.gift;
}

export async function getReceivedGifts() {
  const data = await get<{ gifts: Gift[] }>('/gift/received');
  return data.gifts;
}

export async function getSentGifts() {
  const data = await get<{ gifts: Gift[] }>('/gift/sent');
  return data.gifts;
}

export async function acceptGift(id: string) {
  await patch(`/gift/${id}/accept`);
}

export async function rejectGift(id: string) {
  await patch(`/gift/${id}/reject`);
}

// ===== User API =====

export async function getUserProfile() {
  return get<{ id: string; email: string; name: string; plan: string }>('/user/me');
}

export async function updatePlan(plan: 'free' | 'plus' | 'family') {
  return patch<{ plan: string }>('/user/plan', { plan });
}

// ===== Library API =====

export async function getLibrary(filter?: string) {
  const params = filter ? { filter } : undefined;
  const data = await get<{ items: LibraryItem[] }>('/library', params);
  return data.items;
}

export async function toggleFavorite(id: string) {
  const data = await patch<{ is_favorite: boolean }>(`/library/${id}/favorite`);
  return data.is_favorite;
}

export async function deleteLibraryItem(id: string) {
  return del<{ ok: boolean }>(`/library/${id}`);
}

// ===== Stats API =====

export interface WeekTrend {
  thisWeek: number;
  lastWeek: number;
}

export interface Stats {
  alarms: { total: number; active: number };
  messages: { total: number };
  voices: { total: number };
  friends: { total: number };
  gifts: { received: number; receivedPending: number; sent: number };
  trends: {
    alarms: WeekTrend;
    messages: WeekTrend;
    voices: WeekTrend;
    friends: WeekTrend;
    gifts: WeekTrend;
  };
}

export async function getStats() {
  return get<Stats>('/stats');
}
