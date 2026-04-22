import {
  EnrollInput,
  EnrollInputSchema,
  EnrollResult,
  SeparateInput,
  SeparateInputSchema,
  SeparateResult,
  SynthesizeInput,
  SynthesizeInputSchema,
  SynthesizeResult,
  VoiceProvider,
} from './types.js';

// TODO: real perso.ai integration
// TODO: real elevenlabs integration
export class MockVoiceProvider implements VoiceProvider {
  readonly name = 'mock';

  async enroll(input: EnrollInput): Promise<EnrollResult> {
    const parsed = EnrollInputSchema.parse(input);
    const voiceId = `mock_vp_${parsed.userId}_${hash(parsed.displayName)}`;
    return {
      voiceId,
      status: 'ready',
      provider: this.name,
    };
  }

  async synthesize(input: SynthesizeInput): Promise<SynthesizeResult> {
    const parsed = SynthesizeInputSchema.parse(input);
    const charCount = Array.from(parsed.text).length;
    const durationMs = Math.max(500, charCount * 80);
    return {
      audioUri: `mock://tts/${parsed.voiceId}/${parsed.languageCode}/${hash(parsed.text)}.wav`,
      durationMs,
      provider: this.name,
    };
  }

  async separate(input: SeparateInput): Promise<SeparateResult> {
    const parsed = SeparateInputSchema.parse(input);
    const seed = hash(parsed.audioUri);
    const count = (seed % parsed.maxSpeakers) + 1;
    const speakers = Array.from({ length: count }, (_, i) => ({
      speakerId: `mock_spk_${i + 1}`,
      startMs: i * 3000,
      endMs: (i + 1) * 3000,
      confidence: 0.9 - i * 0.05,
    }));
    return {
      speakers,
      provider: this.name,
    };
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
