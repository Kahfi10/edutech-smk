// Validation utilities - EduTech SMK
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidNis = (nis: string) => /^\d{7,10}$/.test(nis);
export const isValidScore = (score: number, max = 100) => score >= 0 && score <= max;
