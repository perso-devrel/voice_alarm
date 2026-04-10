import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 프로덕션 URL은 .env의 EXPO_PUBLIC_API_URL로 설정
// 개발 시 localhost는 시뮬레이터/터널에서만 동작
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__
    ? 'http://localhost:8787'
    : 'https://voice-alarm-api.your-name.workers.dev');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 60000, // 음성 클론/TTS 생성은 시간이 걸릴 수 있음
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: Google/Apple ID Token 자동 첨부
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그아웃 처리
      await AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// ===== Voice Profile API =====

export async function getVoiceProfiles() {
  const { data } = await api.get('/voice');
  return data.profiles;
}

export async function getVoiceProfile(id: string) {
  const { data } = await api.get(`/voice/${id}`);
  return data.profile;
}

export async function createVoiceClone(
  audioFile: { uri: string; name: string; type: string },
  name: string,
  provider: 'perso' | 'elevenlabs' = 'perso'
) {
  const formData = new FormData();
  formData.append('audio', audioFile as any);
  formData.append('name', name);
  formData.append('provider', provider);

  const { data } = await api.post('/voice/clone', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.profile;
}

export async function diarizeAudio(audioFile: { uri: string; name: string; type: string }) {
  const formData = new FormData();
  formData.append('audio', audioFile as any);

  const { data } = await api.post('/voice/diarize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.speakers;
}

export async function deleteVoiceProfile(id: string) {
  await api.delete(`/voice/${id}`);
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
  const { data } = await api.post('/tts/generate', params);
  return data;
}

export async function getMessages(category?: string) {
  const params = category ? { category } : {};
  const { data } = await api.get('/tts/messages', { params });
  return data.messages;
}

export async function getPresets() {
  const { data } = await api.get('/tts/presets');
  return data.presets;
}

// ===== Alarm API =====

export async function getAlarms() {
  const { data } = await api.get('/alarm');
  return data.alarms;
}

export async function createAlarm(params: {
  message_id: string;
  time: string;
  repeat_days?: number[];
  snooze_minutes?: number;
  target_user_id?: string;
}) {
  const { data } = await api.post('/alarm', params);
  return data.alarm;
}

export async function updateAlarm(id: string, params: {
  time?: string;
  repeat_days?: number[];
  is_active?: boolean;
  snooze_minutes?: number;
  message_id?: string;
}) {
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

// ===== User API =====

export async function getUserProfile() {
  const { data } = await api.get('/user/me');
  return data;
}

export async function updatePlan(plan: 'free' | 'plus' | 'family') {
  const { data } = await api.patch('/user/plan', { plan });
  return data;
}

// ===== Library API =====

export async function getLibrary(filter?: string) {
  const params = filter ? { filter } : {};
  const { data } = await api.get('/library', { params });
  return data.items;
}

export async function toggleFavorite(id: string) {
  const { data } = await api.patch(`/library/${id}/favorite`);
  return data.is_favorite;
}

export default api;
