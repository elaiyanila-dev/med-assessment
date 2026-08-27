import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { UserRole } from "@prisma/client";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
