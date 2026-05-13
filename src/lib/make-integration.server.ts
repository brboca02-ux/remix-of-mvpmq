// Server-only helpers for Make integration
// (Imports allowed in *.server.ts via import-protection)
import { createHmac } from "crypto";

export function generateSecretToken(): string {
  // 32 random bytes -> hex
  const arr = new Uint8Array(32);
  // crypto global available in Workers
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return `+${digits.slice(0, Math.min(4, digits.length - 4))}***${digits.slice(-4)}`;
}

export function maskEmail(email?: string | null): string {
  if (!email || !email.includes("@")) return "";
  const [user, domain] = email.split("@");
  const safeUser = user.length <= 2 ? "*".repeat(user.length) : user[0] + "***" + user.slice(-1);
  return `${safeUser}@${domain}`;
}

export function maskMessagePreview(message: string, maxLen = 300): string {
  if (!message) return "";
  // Mask any obvious phone/email patterns
  const masked = message
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, (m) => maskEmail(m))
    .replace(/(\+?\d[\d\s().-]{8,}\d)/g, (m) => maskPhone(m));
  return masked.length > maxLen ? masked.slice(0, maxLen) + "…" : masked;
}

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^0\./,
  /^localhost$/i,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
];

export function validateWebhookUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  if (!raw || typeof raw !== "string") return { ok: false, reason: "URL vazia" };
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "URL inválida" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "Apenas HTTPS é permitido" };
  }
  const host = url.hostname.toLowerCase();
  if (PRIVATE_RANGES.some((r) => r.test(host))) {
    return { ok: false, reason: "Endereços internos não são permitidos" };
  }
  return { ok: true, url };
}
