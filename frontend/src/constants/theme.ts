export const colors = {
  deepGreen: '#2D4A3E',
  beigeLight: '#FDFBF4',
  beigeDim: '#EDE7D8',
  textPrimary: '#1C1A16',
  textMuted: '#9E9E8A',
  border: 'rgba(0,0,0,0.08)',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  success: '#16A34A',
} as const;

// backward compat — reading-plan/reading-group 모듈용
export const COLORS = {
  ...colors,
  beigeDark: colors.beigeDim,
  textSecondary: colors.textMuted,
  completedGreen: '#22C55E',
} as const;
