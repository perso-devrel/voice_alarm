const PERSO_BASE_URL = 'https://api.perso.ai';

export class PersoClient {
  constructor(private apiKey: string) {}

  private async request(path: string, options: RequestInit = {}) {
    const url = `${PERSO_BASE_URL}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Perso API error ${res.status}: ${errorBody}`);
    }

    return res;
  }

  /** 음성 클론 생성 - 오디오 파일을 업로드하여 voice_id를 받음 */
  async createVoiceClone(audioData: ArrayBuffer, name: string): Promise<{ voice_id: string }> {
    const formData = new FormData();
    formData.append('audio', new Blob([audioData]), 'voice_sample.wav');
    formData.append('name', name);

    const res = await fetch(`${PERSO_BASE_URL}/v1/voices/clone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Perso clone error ${res.status}: ${errorBody}`);
    }

    return res.json();
  }

  /** 클론된 음성으로 TTS 생성 */
  async textToSpeech(voiceId: string, text: string, options?: {
    speed?: number;
    pitch?: number;
  }): Promise<ArrayBuffer> {
    const res = await this.request('/v1/tts', {
      method: 'POST',
      body: JSON.stringify({
        voice_id: voiceId,
        text,
        speed: options?.speed ?? 1.0,
        pitch: options?.pitch ?? 1.0,
        output_format: 'mp3',
      }),
    });

    return res.arrayBuffer();
  }

  /** 음성 프로필 조회 */
  async getVoice(voiceId: string): Promise<{ voice_id: string; name: string; status: string }> {
    const res = await this.request(`/v1/voices/${voiceId}`);
    return res.json();
  }

  /** 음성 프로필 삭제 */
  async deleteVoice(voiceId: string): Promise<void> {
    await this.request(`/v1/voices/${voiceId}`, { method: 'DELETE' });
  }
}
