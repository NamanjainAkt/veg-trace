function extractStringFromBlock(item: unknown): string {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') {
    const rec = item as Record<string, unknown>;
    if (typeof rec.text === 'string') return rec.text.trim();
    if (typeof rec.line === 'string') return rec.line.trim();
    if (typeof rec.value === 'string') return rec.value.trim();
  }
  return '';
}

/**
 * Normalizes every known shape returned by OCR engines into plain text.
 * - expo-text-extractor v2 returns string[] (one entry per recognized line);
 * - ML Kit Android wrappers may return { text: string[] } or { lines: ... } or { blocks: ... };
 * - iOS Vision wrappers return { text: string } or { blocks: [{ text }] };
 * Preserves line breaks and trims empty lines.
 */
export function normalizeResult(raw: unknown): { text: string; blocks: string[] } {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const blocks = trimmed ? trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];
    return { text: trimmed, blocks };
  }

  if (Array.isArray(raw)) {
    const lines = raw
      .map(extractStringFromBlock)
      .filter((line): line is string => line.length > 0);
    return { text: lines.join('\n'), blocks: lines };
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;

    // 1. Text property might be a string or array of strings/objects
    let textStr = '';
    if (typeof obj.text === 'string') {
      textStr = obj.text.trim();
    } else if (Array.isArray(obj.text)) {
      const extracted = obj.text.map(extractStringFromBlock).filter(Boolean);
      textStr = extracted.join('\n');
    }

    // 2. Look for block/line arrays in blocks, lines, results, or data
    const listRaw = Array.isArray(obj.blocks)
      ? obj.blocks
      : Array.isArray(obj.lines)
        ? obj.lines
        : Array.isArray(obj.results)
          ? obj.results
          : Array.isArray(obj.data)
            ? obj.data
            : [];

    const blocks = listRaw
      .map(extractStringFromBlock)
      .filter((b): b is string => b.length > 0);

    const finalText = textStr || blocks.join('\n');
    const finalBlocks = blocks.length > 0
      ? blocks
      : finalText ? finalText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];

    return { text: finalText, blocks: finalBlocks };
  }

  return { text: '', blocks: [] };
}
