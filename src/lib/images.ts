export function compressImageFile(file: File, maxWidth = 1400, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo debe ser una imagen."));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo procesar la imagen."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });
}

/** Compresión más agresiva para fotos de cédula (data URL más liviana). */
export function compressIdImage(file: File): Promise<string> {
  return compressImageFile(file, 1000, 0.55);
}

export function isValidDataImage(url: string, minLen = 500): boolean {
  return typeof url === "string" && url.startsWith("data:image/") && url.length >= minLen;
}

export function parseImageList(raw: string | null | undefined, fallback?: string): string[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        const urls = parsed.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 6);
        if (urls.length) return urls;
      }
    } catch {
      /* ignore malformed JSON */
    }
  }
  return fallback ? [fallback] : [];
}
