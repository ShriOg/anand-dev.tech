import jwt from "jsonwebtoken";

export function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET || "default_fallback_secret_for_dev_only";
  return jwt.sign({ userId }, secret, { expiresIn: "30d" });
}

export function verifyToken(token: string): string | null {
  try {
    const secret = process.env.JWT_SECRET || "default_fallback_secret_for_dev_only";
    const decoded = jwt.verify(token, secret) as any;
    return decoded.userId || null;
  } catch (error) {
    return null;
  }
}
