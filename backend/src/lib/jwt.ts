import jwt from "jsonwebtoken";

const secret = process.env.SESSION_SECRET;

if (!secret || secret.length < 32) {
  throw new Error("CRITICAL: SESSION_SECRET environment variable is missing or less than 32 characters. Server refusing to start to prevent token forging.");
}

export const JWT_SECRET = secret;

export const signToken = (payload: object, expiresIn: string | number = '30d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
