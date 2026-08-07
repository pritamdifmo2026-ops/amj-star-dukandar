export const removeWhiteBackground = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // If the pixel is light (like paper), make it transparent
        if (luminance > 160) {
          data[i + 3] = 0; // Alpha to 0
        } else {
          // Make the remaining pixels dark to ensure the signature is visible
          data[i] = Math.max(0, r - 60);
          data[i + 1] = Math.max(0, g - 60);
          data[i + 2] = Math.max(0, b - 60);
          // Keep it fully opaque
          data[i + 3] = 255;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};
