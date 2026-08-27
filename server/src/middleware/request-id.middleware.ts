import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incomingId = req.headers["x-request-id"];
  const requestId =
    typeof incomingId === "string" && incomingId.trim() !== ""
      ? incomingId.trim()
      : crypto.randomUUID();

  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};
