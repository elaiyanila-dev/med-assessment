import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { httpLoggingMiddleware } from "./middleware/logging.middleware.js";

const app = express();

// Request ID and Security middleware
app.use(requestIdMiddleware);
app.use(httpLoggingMiddleware);
app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api", routes);

// Error and 404 Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

