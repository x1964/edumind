export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";

/**
 * Detects a supported raster image from its MIME type and magic bytes.
 * Returns null when the file is not a jpeg/png/webp within the size limit.
 */
export async function identifyImage(file: File): Promise<SupportedImageMime | null> {
  if (!file.size || file.size > MAX_IMAGE_BYTES) return null;
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    file.type === "image/png" &&
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (
    file.type === "image/webp" &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export function imageExtension(mime: SupportedImageMime): string {
  return mime === "image/jpeg" ? "jpg" : mime.slice(6);
}
