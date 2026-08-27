import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";
import { UserRole } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return sendError(res, "UNAUTHORIZED", "Access token is required", 401);
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return sendError(res, "INVALID_TOKEN", "Invalid token payload", 401);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, status: true, deletedAt: true }
    });

    if (!dbUser || dbUser.status !== "ACTIVE" || dbUser.deletedAt !== null) {
      return sendError(res, "UNAUTHORIZED", "Account is disabled, inactive, or suspended", 401);
    }

    req.user = {
      userId: dbUser.id,
      role: dbUser.role
    };
    next();
  } catch (error) {
    return sendError(res, "INVALID_TOKEN", "Invalid or expired token", 401);
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "UNAUTHORIZED", "User authentication required", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        "FORBIDDEN",
        `User role '${req.user.role}' is not authorized to access this resource`,
        403
      );
    }

    next();
  };
};

