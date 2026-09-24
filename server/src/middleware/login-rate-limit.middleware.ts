import { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { sendError } from "../utils/response.js";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const loginRateLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req: Request, res: Response) => {
    sendError(
      res,
      "LOGIN_RATE_LIMITED",
      "Too many unsuccessful login attempts. Please try again in 15 minutes.",
      429
    );
  }
});
