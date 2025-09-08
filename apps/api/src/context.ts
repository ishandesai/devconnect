import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const prisma = new PrismaClient();

export type Ctx = { prisma: PrismaClient; userId?: string };

type JwtPayload = { sub: string; exp?: number; iat?: number };

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export function getUserIdFromAuthHeader(auth?: string): string | undefined {
  if (!auth) return undefined;
  const [scheme, token] = auth.trim().split(/\s+/);
  if (scheme !== 'Bearer' || !token) return undefined;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload.sub;
  } catch {
    return undefined;
  }
}
