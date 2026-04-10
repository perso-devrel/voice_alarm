import axios from 'axios';

// 프로덕션: VITE_API_URL 환경변수 사용
// 개발: vite.config.ts의 proxy로 /api → localhost:8787
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

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
  }
);

export async function getVoiceProfiles() {
  const { data } = await api.get('/voice');
  return data.profiles;
}

export async function createVoiceClone(file: File, name: string, provider: string = 'perso') {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('name', name);
  formData.append('provider', provider);
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

export async function getPresets() {
  const { data } = await api.get('/tts/presets');
  return data.presets;
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

export async function getUserProfile() {
  const { data } = await api.get('/user/me');
  return data;
}

export default api;
