export interface Env {
  PERSO_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  GOOGLE_CLIENT_ID: string;
  ENVIRONMENT: string;
}

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
  category: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' | 'custom';
  is_preset: boolean;
  created_at: string;
}

export interface Alarm {
  id: string;
  user_id: string;
  message_id: string;
  time: string; // HH:mm
  repeat_days: string; // JSON array: [0,1,2,3,4,5,6] (0=Sun)
  is_active: boolean;
  snooze_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  google_id: string;
  email: string;
  plan: 'free' | 'plus' | 'family';
  daily_tts_count: number;
  daily_tts_reset_at: string;
  created_at: string;
}
