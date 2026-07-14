import { issueToken } from "../_auth";
const accounts: Record<string,string> = {
  "pengte@saj.com": "u1",
  "liusj@saj.com": "u2",
  "yangyq@saj.com": "u3",
  "qinkl@saj.com": "u4",
};

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json() as { email?: string; password?: string };
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const userId = accounts[normalizedEmail];
    const configured = JSON.parse(process.env.PRISM_AUTH_PASSWORD_HASHES ?? "{}") as Record<string,string>;
    if (!userId || !password || !configured[userId] || await sha256(password) !== configured[userId]) {
      return Response.json({ error: "账号或密码不正确" }, { status: 401 });
    }
    return Response.json({ userId, token: await issueToken(userId) });
  } catch {
    return Response.json({ error: "请求格式不正确" }, { status: 400 });
  }
}
