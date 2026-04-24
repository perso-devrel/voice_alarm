export type CharacterStage = 'seed' | 'sprout' | 'tree' | 'bloom';

const STAGE_EMOJI: Record<CharacterStage, string> = {
  seed: '🌱',
  sprout: '🌿',
  tree: '🌳',
  bloom: '🌸',
};

const STAGE_LABEL: Record<CharacterStage, string> = {
  seed: '씨앗',
  sprout: '새싹',
  tree: '나무',
  bloom: '꽃',
};

const DIALOGUES: Record<CharacterStage, readonly string[]> = {
  seed: [
    '조용히 자라고 있어요.',
    '햇살이 필요해요. ☀️',
    '물 주실래요?',
    '아직은 작지만, 곧 자랄 거예요.',
    '흙 속에서 단단한 꿈을 키우고 있어요.',
    '뿌리를 내릴 준비를 하고 있어요.',
    '비가 오면 더 깊이 뿌리를 내릴 거예요.',
  ],
  sprout: [
    '새싹이 돋았어요!',
    '바람이 기분 좋아요. 🌬️',
    '오늘도 같이 깨워주세요.',
    '조금씩 자라고 있어요.',
    '작은 뿌리가 땅을 움켜쥐고 있어요.',
    '줄기가 조금씩 굵어지고 있어요!',
    '첫 잎이 돋아났어요. 🌿',
  ],
  tree: [
    '그늘을 드리워 드릴게요. 🌳',
    '오늘 알람 잘 들으셨나요?',
    '나무가 되었어요!',
    '가족도 같이 깨워봐요.',
    '뿌리가 깊어지고 있어요.',
    '줄기가 튼튼해졌어요!',
    '잎이 무성해지고 있어요.',
  ],
  bloom: [
    '꽃이 피었어요! 🌸',
    '완전 잘 자랐죠?',
    '함께 해주셔서 고마워요.',
    '이 순간이 제일 좋아요.',
    '뿌리부터 꽃잎까지, 온전히 자랐어요.',
    '나무 그늘 아래서 쉬어가세요.',
    '꽃잎이 바람에 흩날려요. 🌸',
  ],
};

const STREAK_DIALOGUES: { minStreak: number; lines: readonly string[] }[] = [
  { minStreak: 90, lines: [
    '전설의 나무가 되었어요! 🌸',
    '90일 넘게 함께했어요. 정말 대단해요!',
    '당신의 뿌리는 누구보다 깊어요.',
  ]},
  { minStreak: 30, lines: [
    '30일 연속! 잎이 무성하게 자랐어요.',
    '한 달 동안 매일 함께 해주셨어요!',
    '줄기가 하늘을 향해 쭉 뻗었어요!',
  ]},
  { minStreak: 7, lines: [
    '7일 연속! 뿌리가 단단히 내려앉았어요.',
    '일주일 동안 꾸준히 일어나고 있어요!',
    '줄기가 눈에 띄게 굵어졌어요!',
  ]},
  { minStreak: 3, lines: [
    '뿌리가 조금씩 깊어지고 있어요!',
    '연속 기상 중! 작은 새싹이 기뻐해요.',
    '매일 물을 주니까 쑥쑥 자라요.',
  ]},
  { minStreak: 1, lines: [
    '오늘도 일어났군요! 뿌리가 자라기 시작해요.',
    '연속 기상 시작! 함께 성장해요.',
  ]},
];

export interface CharacterPayload {
  stage?: CharacterStage | string;
  xp?: number;
  level?: number;
}

export interface ProgressPayload {
  xp_into_level?: number;
  xp_to_next_level?: number;
  level_span?: number;
  progress_ratio?: number;
}

export function normalizeStage(stage: unknown): CharacterStage {
  if (stage === 'sprout' || stage === 'tree' || stage === 'bloom') return stage;
  return 'seed';
}

export function stageToEmoji(stage: unknown): string {
  return STAGE_EMOJI[normalizeStage(stage)];
}

export function stageToLabel(stage: unknown): string {
  return STAGE_LABEL[normalizeStage(stage)];
}

export function listDialogues(stage: unknown): readonly string[] {
  return DIALOGUES[normalizeStage(stage)];
}

export function pickRandomDialogue(
  stage: unknown,
  rng: () => number = Math.random,
): string {
  const list = DIALOGUES[normalizeStage(stage)];
  if (list.length === 0) return '';
  const safeRng = typeof rng === 'function' ? rng : Math.random;
  const raw = safeRng();
  const ratio = Number.isFinite(raw) ? Math.max(0, Math.min(raw, 0.999999)) : 0;
  const idx = Math.floor(ratio * list.length);
  return list[idx] ?? list[0];
}

export function pickStreakAwareDialogue(
  stage: unknown,
  streak: number,
  rng: () => number = Math.random,
): string {
  const safeRng = typeof rng === 'function' ? rng : Math.random;
  const roll = safeRng();
  const rollRatio = Number.isFinite(roll) ? Math.max(0, Math.min(roll, 0.999999)) : 0;

  if (streak >= 1 && rollRatio < 0.4) {
    const tier = STREAK_DIALOGUES.find((d) => streak >= d.minStreak);
    if (tier && tier.lines.length > 0) {
      const r2 = safeRng();
      const r2Ratio = Number.isFinite(r2) ? Math.max(0, Math.min(r2, 0.999999)) : 0;
      const idx = Math.floor(r2Ratio * tier.lines.length);
      return tier.lines[idx] ?? tier.lines[0];
    }
  }

  return pickRandomDialogue(stage, safeRng);
}

export function formatProgress(progress: ProgressPayload | null | undefined): string {
  const into = Math.max(Number(progress?.xp_into_level ?? 0), 0);
  const span = Math.max(Number(progress?.level_span ?? 0), 0);
  const ratio =
    span > 0 && Number.isFinite(Number(progress?.progress_ratio))
      ? Math.max(0, Math.min(Number(progress?.progress_ratio), 1))
      : 0;
  const pct = Math.round(ratio * 100);
  return `XP ${into} / ${span} (${pct}%)`;
}

const STAGE_ORDER: CharacterStage[] = ['seed', 'sprout', 'tree', 'bloom'];

export function stageIndex(stage: unknown): number {
  return STAGE_ORDER.indexOf(normalizeStage(stage));
}

export function shouldShowStageTransition(prev: unknown, next: unknown): boolean {
  if (prev == null || next == null) return false;
  const p = normalizeStage(prev);
  const n = normalizeStage(next);
  return p !== n;
}

export function progressBarWidthPct(progress: ProgressPayload | null | undefined): number {
  const ratio = Number(progress?.progress_ratio ?? 0);
  if (!Number.isFinite(ratio)) return 0;
  return Math.max(0, Math.min(ratio, 1)) * 100;
}
