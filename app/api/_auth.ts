const encoder = new TextEncoder();

function secret() {
  const value = process.env.PRISM_SESSION_SECRET;
  if (!value) throw new Error("PRISM_SESSION_SECRET is not configured");
  return value;
}

async function signature(payload: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function issueToken(userId: string) {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const payload = `${userId}.${expires}`;
  return `${payload}.${await signature(payload)}`;
}

export async function verifyRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const [userId, expiresText, supplied] = token.split(".");
  if (!userId || !expiresText || !supplied || Number(expiresText) < Math.floor(Date.now() / 1000)) return null;
  const expected = await signature(`${userId}.${expiresText}`);
  if (expected.length !== supplied.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return mismatch === 0 ? userId : null;
}
