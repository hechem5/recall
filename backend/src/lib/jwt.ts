import jwt, { SignOptions } from "jsonwebtoken";

const secret = process.env.SESSION_SECRET as string;

export const JWT_SECRET = secret;

export const signToken = (payload: object, expiresIn: SignOptions['expiresIn'] = '30d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
