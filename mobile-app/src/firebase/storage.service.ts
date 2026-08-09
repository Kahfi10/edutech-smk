/**
 * storage.service.ts
 * Firebase Storage TIDAK digunakan (butuh plan berbayar).
 * Untuk demo: file upload disimulasikan dengan URL placeholder.
 *
 * Untuk produksi nanti: upgrade ke Firebase Blaze plan dan
 * uncomment kode Firebase Storage di bawah.
 */

export type UploadProgressCallback = (pct: number) => void;

/**
 * Simulasi upload file — langsung return URL demo
 * tanpa benar-benar mengupload ke server.
 */
export const uploadFile = async (
  _path: string,
  _file: Blob,
  onProgress?: UploadProgressCallback,
): Promise<string> => {
  // Simulasi progress 0 → 100%
  for (let i = 0; i <= 100; i += 20) {
    await new Promise(r => setTimeout(r, 80));
    onProgress?.(i);
  }

  // Return URL demo yang bisa dibuka
  const demoUrls: Record<string, string> = {
    'materials/': 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
    'submissions/': 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1',
  };

  for (const [key, url] of Object.entries(demoUrls)) {
    if (_path.startsWith(key)) return url;
  }

  return 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1';
};

export const deleteFile  = async (_path: string): Promise<void> => {};
export const getFileUrl  = async (_path: string): Promise<string> =>
  'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1';
