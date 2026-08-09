/**
 * EduTech SMK — Monochrome Design System
 * Inspired by Apple Human Interface Guidelines
 */

// ─── Monochrome Palette ───────────────────────────────────────────
export const Colors = {
  // Blacks & Whites
  black:   '#000000',
  white:   '#FFFFFF',

  // System Grays (iOS scale)
  gray1:   '#1C1C1E',
  gray2:   '#2C2C2E',
  gray3:   '#3A3A3C',
  gray4:   '#48484A',
  gray5:   '#636366',
  gray6:   '#8E8E93',
  gray7:   '#AEAEB2',
  gray8:   '#C7C7CC',
  gray9:   '#D1D1D6',
  gray10:  '#E5E5EA',
  gray11:  '#F2F2F7',

  // Semantic
  label:           '#000000',
  secondaryLabel:  '#3C3C43',
  tertiaryLabel:   '#8E8E93',
  quaternaryLabel: '#C7C7CC',

  separator:       '#E5E5EA',
  opaqueSeparator: '#C7C7CC',

  // Backgrounds
  background:           '#F2F2F7',
  secondaryBackground:  '#FFFFFF',
  groupedBackground:    '#F2F2F7',
  cardBackground:       '#FFFFFF',

  // Fills
  fill:          '#78788033',
  secondaryFill: '#78788028',
  tertiaryFill:  '#E5E5EA',

  // Accents (minimal, desaturated)
  accent:        '#000000',
  accentSoft:    '#1C1C1E',
  destructive:   '#3A3A3C',
};

// ─── Typography ──────────────────────────────────────────────────
export const Typography = {
  largeTitle:  { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37, color: Colors.label },
  title1:      { fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.36, color: Colors.label },
  title2:      { fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.35, color: Colors.label },
  title3:      { fontSize: 20, fontWeight: '600' as const, letterSpacing: 0.38, color: Colors.label },
  headline:    { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.41, color: Colors.label },
  body:        { fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.41, color: Colors.label },
  callout:     { fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.32, color: Colors.label },
  subheadline: { fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.24, color: Colors.secondaryLabel },
  footnote:    { fontSize: 13, fontWeight: '400' as const, letterSpacing: -0.08, color: Colors.secondaryLabel },
  caption1:    { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0, color: Colors.tertiaryLabel },
  caption2:    { fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.07, color: Colors.tertiaryLabel },
};

// ─── Spacing ─────────────────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
};

// ─── Border Radius ───────────────────────────────────────────────
export const Radius = {
  xs:   6,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
};

// ─── Shadows (iOS subtle) ────────────────────────────────────────
export const Shadow = {
  none: {},
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ─── Role Config (monochrome, icon-based) ────────────────────────
export const RoleConfig: Record<string, {
  label: string;
  icon: string;
  headerBg: string;
  headerText: string;
  tintColor: string;
}> = {
  STUDENT: {
    label: 'Siswa',
    icon: 'person',
    headerBg: Colors.black,
    headerText: Colors.white,
    tintColor: Colors.black,
  },
  TEACHER: {
    label: 'Guru Mapel',
    icon: 'book',
    headerBg: Colors.gray1,
    headerText: Colors.white,
    tintColor: Colors.gray1,
  },
  WALI: {
    label: 'Wali Kelas',
    icon: 'people',
    headerBg: Colors.gray2,
    headerText: Colors.white,
    tintColor: Colors.gray2,
  },
  BK: {
    label: 'Guru BK',
    icon: 'chatbubbles',
    headerBg: Colors.gray1,
    headerText: Colors.white,
    tintColor: Colors.gray1,
  },
  PIKET: {
    label: 'Guru Piket',
    icon: 'shield-checkmark',
    headerBg: Colors.black,
    headerText: Colors.white,
    tintColor: Colors.black,
  },
  ADMIN: {
    label: 'Administrator',
    icon: 'settings',
    headerBg: Colors.gray1,
    headerText: Colors.white,
    tintColor: Colors.gray1,
  },
};
