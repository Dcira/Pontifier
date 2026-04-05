import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createServer } from "http";

import { initSocket } from "./src/config/socket.js";
import { errorHandler } from "./src/middleware/error.middleware.js";
import { errorResponse } from "./src/utils/response.utils.js";

import authRoutes from "./src/routes/auth.routes.js";
import usersRoutes from "./src/routes/users.routes.js";
import delegatesRoutes from "./src/routes/delegates.routes.js";
import registerRoutes from "./src/routes/register.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import collegesRoutes from "./src/routes/colleges.routes.js";

const app = express();

// Trust the first proxy — required when deployed behind a load balancer/reverse proxy
app.set("trust proxy", 1);

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(helmet());
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", globalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/delegates", delegatesRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/colleges", collegesRoutes);

app.use((req, res) => {
  res.status(404).json(errorResponse("Not found"));
});

app.use(errorHandler);

const port = parseInt(process.env.PORT || "5000", 10);
const httpServer = createServer(app);

initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Campaign HQ API listening on port ${port}`);
});