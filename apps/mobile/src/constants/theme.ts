export const Colors = {
  light: {
    primary: '#FF7F6B', // 코랄
    primaryLight: '#FFB4A8', // 라이트 코랄
    primaryDark: '#E05A47',
    secondary: '#FFCBA4', // 피치
    accent: '#FF6B8A', // 핑크 악센트
    background: '#FFF5F3', // 따뜻한 배경
    surface: '#FFFFFF',
    surfaceVariant: '#FFF0ED',
    text: '#2D2D2D',
    textSecondary: '#8E8E93',
    textTertiary: '#AEAEB2',
    border: '#F2E8E5',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    shadow: 'rgba(255, 127, 107, 0.15)',
  },
  dark: {
    primary: '#FF8F7D',
    primaryLight: '#FFAA99',
    primaryDark: '#E06A58',
    secondary: '#FFD4B3',
    accent: '#FF7B96',
    background: '#1C1C1E',
    surface: '#2C2C2E',
    surfaceVariant: '#3A3A3C',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    border: '#38383A',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  hero: 34,
} as const;
