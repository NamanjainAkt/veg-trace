import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/** Downscale label photos before OCR: faster, lower memory, same accuracy. */
export async function preprocessLabelImage(uri: string): Promise<string> {
  if (!uri) return uri;
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 1600 } }],
      { compress: 0.9, format: SaveFormat.JPEG }
    );
    return result.uri || uri;
  } catch {
    return uri;
  }
}
