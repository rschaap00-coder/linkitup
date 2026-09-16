export function sameOrigin(request:Request) {
  try {
    const expected = process.env.AUTH_URL ? new URL(process.env.AUTH_URL).origin : new URL(request.url).origin;
    return request.headers.get('origin') === expected;
  } catch { return false; }
}
export async function boundedBody(request: Request, limit: number) {
  if (Number(request.headers.get('content-length') || 0) > limit) throw new Error('BODY_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset);offset += chunk.length; }
  return bytes;
}
