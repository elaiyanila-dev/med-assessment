import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const loginSchema = z.object({
  email: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

const loginIdentifierMap: Record<string, string> = {
  doctor: "dr.rohan.sharma@mednxt.demo",
  admin: "admin@mednxt.demo",
  receptionist: "frontdesk@mednxt.demo"
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const identifier = email.trim().toLowerCase();
    const loginEmail = loginIdentifierMap[identifier] || identifier;

    const user = await prisma.user.findUnique({
      where: { email: loginEmail }
    });

    if (!user) {
      return sendError(res, "INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, "INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    if (user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "ACCOUNT_DISABLED", "Account is disabled, inactive, or suspended", 401);
    }

    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        specialization: user.specialization
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        specialization: true,
        status: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      return sendError(res, "USER_NOT_FOUND", "User profile not found or inactive", 404);
    }

    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  return sendSuccess(res, { message: "Logged out successfully" });
};
