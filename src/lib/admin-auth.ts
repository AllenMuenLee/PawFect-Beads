import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Gr210090";
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "change-this-admin-session-secret";
const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

type SessionPayload = {
  role: "admin";
  exp: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(data: string) {
  return createHmac("sha256", ADMIN_SESSION_SECRET).update(data).digest("base64url");
}

export function isValidAdminPassword(password: string) {
  return password === ADMIN_PASSWORD;
}

export function createAdminSessionToken() {
  const payload: SessionPayload = {
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload);

  try {
    const isMatch = timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    if (!isMatch) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    const nowInSeconds = Math.floor(Date.now() / 1000);

    return payload.role === "admin" && payload.exp > nowInSeconds;
  } catch {
    return false;
  }
}

export function getAdminSessionCookieConfig() {
  return {
    name: ADMIN_SESSION_COOKIE,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
