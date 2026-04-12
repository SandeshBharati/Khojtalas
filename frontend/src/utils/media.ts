export const INLINE_IMAGE_MAX_BYTES = 250_000;
export const INLINE_VIDEO_MAX_BYTES = 400_000;

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};