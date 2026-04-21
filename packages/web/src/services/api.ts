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

export async function updateVoiceProfile(id: string, name: string) {
  const { data } = await api.patch(`/voice/${id}`, { name });
  return data.profile as { id: string; name: string };
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
  mode?: 'tts' | 'sound-only';
  voice_profile_id?: string;
  speaker_id?: string;
  snooze_minutes?: number;
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

// ===== Billing / Voucher API =====

export interface VoucherItem {
  id: string;
  code: string;
  plan_id: string;
  plan_key: string;
  plan_name: string;
  plan_type: string;
  subscription_id: string | null;
  redeemed_by_user_id: string | null;
  status: 'issued' | 'used' | 'expired';
  issued_at: string;
  used_at: string | null;
  expires_at: string;
}

export async function getVouchers(): Promise<VoucherItem[]> {
  const { data } = await api.get('/billing/vouchers');
  return data.vouchers as VoucherItem[];
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

// ===== Dub API =====

export interface DubLanguage {
  code: string;
  name: string;
  experiment: boolean;
}

export interface DubJob {
  id: string;
  source_message_id: string | null;
  source_language: string;
  target_language: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  progress: number;
  result_message_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface DubResult {
  dub_id: string;
  status: string;
  progress: number;
  result_message_id?: string;
  audio_base64?: string;
  audio_format?: string;
  error_message?: string;
  expected_remaining_minutes?: number;
}

export async function getDubLanguages() {
  const { data } = await api.get('/dub/languages');
  return data.languages as DubLanguage[];
}

export async function startDub(
  audioFile: File,
  sourceLanguage: string,
  targetLanguage: string,
  sourceMessageId?: string,
) {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('source_language', sourceLanguage);
  formData.append('target_language', targetLanguage);
  if (sourceMessageId) {
    formData.append('source_message_id', sourceMessageId);
  }
  const { data } = await api.post('/dub', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { dub_id: string; status: string };
}

export async function getDubStatus(dubId: string) {
  const { data } = await api.get(`/dub/${dubId}`);
  return data as DubResult;
}

export async function getDubJobs() {
  const { data } = await api.get('/dub/jobs');
  return data.jobs as DubJob[];
}

// ===== Voice upload & speaker picker =====

export interface VoiceUploadMeta {
  id: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  originalName: string | null;
  createdAt: string;
}

export interface Speaker {
  id: string;
  upload_id: string;
  label: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
  created_at?: string;
}

export async function uploadVoiceAudio(file: File, durationMs?: number): Promise<VoiceUploadMeta> {
  const form = new FormData();
  form.append('audio', file);
  if (durationMs !== undefined) form.append('durationMs', String(durationMs));
  if (file.name) form.append('originalName', file.name);
  const { data } = await api.post('/voice/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.upload as VoiceUploadMeta;
}

export async function separateUpload(uploadId: string): Promise<Speaker[]> {
  const { data } = await api.post(`/voice/uploads/${uploadId}/separate`);
  return (data.speakers as Array<Record<string, unknown>>).map(normalizeSpeaker);
}

export async function listSpeakers(uploadId: string): Promise<Speaker[]> {
  const { data } = await api.get(`/voice/uploads/${uploadId}/speakers`);
  return (data.speakers as Array<Record<string, unknown>>).map(normalizeSpeaker);
}

export async function renameSpeaker(
  uploadId: string,
  speakerId: string,
  label: string,
): Promise<{ id: string; label: string }> {
  const { data } = await api.patch(`/voice/uploads/${uploadId}/speakers/${speakerId}`, { label });
  return data.speaker as { id: string; label: string };
}

function normalizeSpeaker(raw: Record<string, unknown>): Speaker {
  return {
    id: String(raw.id ?? raw['speaker_id'] ?? ''),
    upload_id: String(raw.upload_id ?? raw.uploadId ?? ''),
    label: String(raw.label ?? ''),
    start_ms: Number(raw.start_ms ?? raw.startMs ?? 0),
    end_ms: Number(raw.end_ms ?? raw.endMs ?? 0),
    confidence: Number(raw.confidence ?? 0),
    created_at: raw.created_at as string | undefined,
  };
}

export default api;
