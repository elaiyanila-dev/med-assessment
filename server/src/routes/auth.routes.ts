import { Router } from "express";
import { login, getMe, logout } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { loginRateLimiter } from "../middleware/login-rate-limit.middleware.js";

const router = Router();

router.post("/login", loginRateLimiter, login);
router.get("/me", authenticateToken, getMe);
router.post("/logout", logout);

export default router;
