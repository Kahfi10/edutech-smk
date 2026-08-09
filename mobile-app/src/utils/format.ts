// Format utilities - EduTech SMK
export const formatPoints = (pts: number) => `+${pts} poin`;
export const formatScore  = (score: number | null | undefined, max = 100) =>
  score != null ? `${score}/${max}` : '-';
export const formatStatus = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1);
