// Date utility functions - EduTech SMK
export const formatDate = (date: Date | undefined, opts?: Intl.DateTimeFormatOptions) =>
  date?.toLocaleDateString('id-ID', opts ?? { day: 'numeric', month: 'short', year: 'numeric' }) ?? '-';
