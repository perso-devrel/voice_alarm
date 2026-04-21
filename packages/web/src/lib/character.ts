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
  ],
  sprout: [
    '새싹이 돋았어요!',
    '바람이 기분 좋아요. 🌬️',
    '오늘도 같이 깨워주세요.',
    '조금씩 자라고 있어요.',
  ],
  tree: [
    '그늘을 드리워 드릴게요. 🌳',
    '오늘 알람 잘 들으셨나요?',
    '나무가 되었어요!',
    '가족도 같이 깨워봐요.',
  ],
  bloom: [
    '꽃이 피었어요! 🌸',
    '완전 잘 자랐죠?',
    '함께 해주셔서 고마워요.',
    '이 순간이 제일 좋아요.',
  ],
};

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

/**
 * 스테이지별 대사 랜덤 선택. rng 는 [0,1) 실수를 반환하는 함수(기본 Math.random).
 * 테스트 결정성을 위해 주입 가능.
 */
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

/**
 * 진행률 포맷 — "XP 120 / 400 (30%)"
 * xp_into_level 이 음수거나 level_span 이 0 이하이면 "0 / 0 (0%)".
 */
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

export function progressBarWidthPct(progress: ProgressPayload | null | undefined): number {
  const ratio = Number(progress?.progress_ratio ?? 0);
  if (!Number.isFinite(ratio)) return 0;
  return Math.max(0, Math.min(ratio, 1)) * 100;
}
