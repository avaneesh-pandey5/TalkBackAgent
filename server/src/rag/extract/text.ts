export async function extractTextFromTxt(buffer: Buffer): Promise<string> {
  return buffer.toString("utf8").replace(/\u0000/g, "").trim();
}
