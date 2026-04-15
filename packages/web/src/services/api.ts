import axios from 'axios';

// 프로덕션: VITE_API_URL 환경변수 사용
// 개발: vite.config.ts의 proxy로 /api → localhost:8787
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export async function getVoiceProfiles() {
  const { data } = await api.get('/voice');
  return data.profiles;
}

export async function createVoiceClone(file: File, name: string) {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('name', name);
  const { data } = await api.post('/voice/clone', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.profile;
}

export async function diarizeAudio(file: File) {
  const formData = new FormData();
  formData.append('audio', file);
  const { data } = await api.post('/voice/diarize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.speakers;
}

export async function deleteVoiceProfile(id: string) {
  await api.delete(`/voice/${id}`);
}

export async function generateTTS(params: {
  voice_profile_id: string;
  text: string;
  category?: string;
}) {
  const { data } = await api.post('/tts/generate', params);
  return data;
}

export async function getMessages(category?: string) {
  const { data } = await api.get('/tts/messages', { params: category ? { category } : {} });
  return data.messages;
}

export async function getMessagesByVoice(voiceProfileId: string) {
  const { data } = await api.get('/tts/messages', { params: { voice_profile_id: voiceProfileId } });
  return data.messages;
}

export async function getPresets() {
  const { data } = await api.get('/tts/presets');
  return data.presets;
}

export async function deleteMessage(id: string, force?: boolean) {
  await api.delete(`/tts/messages/${id}${force ? '?force=true' : ''}`);
}

export async function getAlarms() {
  const { data } = await api.get('/alarm');
  return data.alarms;
}

export async function createAlarm(params: {
  message_id: string;
  time: string;
  repeat_days?: number[];
}) {
  const { data } = await api.post('/alarm', params);
  return data.alarm;
}

export async function updateAlarm(id: string, params: Record<string, unknown>) {
  await api.patch(`/alarm/${id}`, params);
}

export async function deleteAlarm(id: string) {
  await api.delete(`/alarm/${id}`);
}

// ===== Friend API =====

export async function sendFriendRequest(email: string) {
  const { data } = await api.post('/friend', { email });
  return data.friendship;
}

export async function getFriendList() {
  const { data } = await api.get('/friend/list');
  return data.friends;
}

export async function getPendingRequests() {
  const { data } = await api.get('/friend/pending');
  return data.pending;
}

export async function acceptFriendRequest(id: string) {
  await api.patch(`/friend/${id}/accept`);
}

export async function deleteFriend(id: string) {
  await api.delete(`/friend/${id}`);
}

// ===== Gift API =====

export async function sendGift(params: {
  recipient_email: string;
  message_id: string;
  note?: string;
}) {
  const { data } = await api.post('/gift', params);
  return data.gift;
}

export async function getReceivedGifts() {
  const { data } = await api.get('/gift/received');
  return data.gifts;
}

export async function getSentGifts() {
  const { data } = await api.get('/gift/sent');
  return data.gifts;
}

export async function acceptGift(id: string) {
  await api.patch(`/gift/${id}/accept`);
}

export async function rejectGift(id: string) {
  await api.patch(`/gift/${id}/reject`);
}

export async function getUserProfile() {
  const { data } = await api.get('/user/me');
  return data;
}

export interface UserSearchResult {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  const { data } = await api.get('/user/search', { params: { q } });
  return data.users;
}

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

export async function getStats(): Promise<Stats> {
  const { data } = await api.get('/stats');
  return data;
}

export interface Activity {
  id: string;
  type: 'alarm' | 'message' | 'gift' | 'voice';
  summary: string;
  created_at: string;
}

export async function getRecentActivity(): Promise<Activity[]> {
  const { data } = await api.get('/stats/activity');
  return data.activities;
}

export async function deleteAccount() {
  await api.delete('/user/me');
}

export default api;
