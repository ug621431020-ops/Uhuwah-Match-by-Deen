/**
 * Utility to compress and resize an uploaded image file to a lightweight base64 Data URL.
 * Keeps localStorage size low and renders fast.
 */
export function compressImage(
  file: File,
  maxWidth: number = 300,
  maxHeight: number = 300,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Crop to square center if desired or resize keeping aspect
        const minDim = Math.min(width, height);
        const sourceX = (width - minDim) / 2;
        const sourceY = (height - minDim) / 2;

        canvas.width = Math.min(minDim, maxWidth);
        canvas.height = Math.min(minDim, maxHeight);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          minDim,
          minDim,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image file'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
