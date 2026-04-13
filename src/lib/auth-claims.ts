import type { AuthUser } from "@/lib/api/auth";

export type AuthSessionClaims = {
  role: "admin" | "user" | null;
  profileCode: string | null;
  userId: string | null;
  isAdmin: boolean;
};

type JwtPayload = Record<string, unknown>;

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
};

const decodeJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
};

const toStringOrNull = (value: unknown) => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return null;
};

const getHasuraClaims = (payload: JwtPayload | null): JwtPayload => {
  if (!payload) return {};

  const direct = payload["https://hasura.io/jwt/claims"];
  if (direct && typeof direct === "object") return direct as JwtPayload;

  return payload;
};

export const extractAuthSessionClaims = (
  token?: string | null,
  fallbackUser?: AuthUser | null,
): AuthSessionClaims => {
  const payload = token ? decodeJwtPayload(token) : null;
  const hasuraClaims = getHasuraClaims(payload);

  const rawRole =
    toStringOrNull(payload?.role) ??
    toStringOrNull(hasuraClaims["x-hasura-default-role"]) ??
    toStringOrNull(fallbackUser?.role) ??
    null;

  const userId =
    toStringOrNull(payload?.user_id) ??
    toStringOrNull(hasuraClaims["x-hasura-user-id"]) ??
    toStringOrNull(fallbackUser?.id);

  const profileCode =
    toStringOrNull(payload?.profile_code) ??
    toStringOrNull(hasuraClaims["x-hasura-profile-code"]) ??
    null;

  const normalizedRole = rawRole?.toLowerCase();
  const role: "admin" | "user" | null =
    normalizedRole === "admin" ? "admin" : normalizedRole === "user" ? "user" : null;

  return {
    role,
    isAdmin: role === "admin",
    profileCode,
    userId,
  };
};

export const extractAuthProfile = extractAuthSessionClaims;
