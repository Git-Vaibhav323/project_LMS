import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  facultyId: string;
  email: string;
}

const JWT_SECRET: string = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  // Fail fast at boot rather than silently signing tokens with an empty secret.
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
