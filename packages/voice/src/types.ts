import { z } from 'zod';

export const EnrollInputSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1).max(32),
  samples: z
    .array(
      z.object({
        uri: z.string().min(1),
        durationMs: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(10),
});
export type EnrollInput = z.infer<typeof EnrollInputSchema>;

export const EnrollResultSchema = z.object({
  voiceId: z.string().min(1),
  status: z.enum(['processing', 'ready', 'failed']),
  provider: z.string().min(1),
});
export type EnrollResult = z.infer<typeof EnrollResultSchema>;

export const SynthesizeInputSchema = z.object({
  voiceId: z.string().min(1),
  text: z.string().min(1).max(2000),
  languageCode: z.string().min(2).max(10).default('ko-KR'),
});
export type SynthesizeInput = z.infer<typeof SynthesizeInputSchema>;

export const SynthesizeResultSchema = z.object({
  audioUri: z.string().min(1),
  durationMs: z.number().int().positive(),
  provider: z.string().min(1),
});
export type SynthesizeResult = z.infer<typeof SynthesizeResultSchema>;

export const SeparateInputSchema = z.object({
  audioUri: z.string().min(1),
  maxSpeakers: z.number().int().min(1).max(6).default(3),
});
export type SeparateInput = z.infer<typeof SeparateInputSchema>;

export const SeparatedSpeakerSchema = z.object({
  speakerId: z.string().min(1),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  confidence: z.number().min(0).max(1),
});
export type SeparatedSpeaker = z.infer<typeof SeparatedSpeakerSchema>;

export const SeparateResultSchema = z.object({
  speakers: z.array(SeparatedSpeakerSchema).min(1),
  provider: z.string().min(1),
});
export type SeparateResult = z.infer<typeof SeparateResultSchema>;

export interface VoiceProvider {
  readonly name: string;
  enroll(input: EnrollInput): Promise<EnrollResult>;
  synthesize(input: SynthesizeInput): Promise<SynthesizeResult>;
  separate(input: SeparateInput): Promise<SeparateResult>;
}
