export type TextChunk = {
  index: number;
  text: string;
};

export type ChunkTextOptions = {
  chunkSize?: number;
  overlap?: number;
};

export function chunkText(input: string, options: ChunkTextOptions = {}): TextChunk[] {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunkSize = options.chunkSize ?? 1000;
  const overlap = options.overlap ?? 200;
  const step = Math.max(1, chunkSize - overlap);

  const chunks: TextChunk[] = [];

  for (let start = 0, index = 0; start < normalized.length; start += step, index += 1) {
    const end = Math.min(normalized.length, start + chunkSize);
    const text = normalized.slice(start, end).trim();
    if (!text) continue;

    chunks.push({ index, text });

    if (end >= normalized.length) {
      break;
    }
  }

  return chunks;
}
