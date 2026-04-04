import jwt from "jsonwebtoken";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export function signAccessToken(payload) {
  const secret = requireEnv("JWT_ACCESS_SECRET");
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  return jwt.sign(payload, secret, { expiresIn });
}

export function signRefreshToken(payload) {
  const secret = requireEnv("JWT_REFRESH_SECRET");
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, requireEnv("JWT_ACCESS_SECRET"));
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, requireEnv("JWT_REFRESH_SECRET"));
}

export function decodeTokenExpiry(token) {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
}
