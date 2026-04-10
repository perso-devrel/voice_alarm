export interface VoiceProfile {
  id: string;
  user_id: string;
  name: string;
  perso_voice_id: string | null;
  elevenlabs_voice_id: string | null;
  avatar_url: string | null;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  voice_profile_id: string;
  text: string;
  audio_url: string | null;
  category: string;
  is_preset: boolean;
  created_at: string;
  voice_name?: string;
}

export interface Alarm {
  id: string;
  user_id: string;
  target_user_id: string | null;
  message_id: string;
  time: string;
  repeat_days: string;
  is_active: boolean;
  snooze_minutes: number;
  message_text?: string;
  voice_name?: string;
  category?: string;
  creator_name?: string;
  creator_email?: string;
}

export interface Friend {
  id: string;
  friend_email: string;
  friend_name?: string;
  friend_picture?: string;
  created_at: string;
}

export interface PendingFriendRequest {
  id: string;
  requester_email: string;
  requester_name?: string;
  requester_picture?: string;
  created_at: string;
}

export interface Gift {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message_text?: string;
  category?: string;
  note: string | null;
  created_at: string;
  sender_email?: string;
  sender_name?: string;
  recipient_email?: string;
  recipient_name?: string;
}

export interface PresetCategory {
  category: string;
  emoji: string;
  messages: string[];
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const apiErr = err as { response?: { data?: { error?: string } } };
  return apiErr?.response?.data?.error ?? fallback;
}
