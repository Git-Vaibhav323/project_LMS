import compression from "compression";
import cors from "cors";
import express, { Application } from "express";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

const app: Application = express();

// --- Core middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Gzip all JSON/text responses — cuts payload size significantly
app.use(compression());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Faculty CMS API is running." });
});

// --- API routes ---
app.use("/api", routes);

// --- 404 + error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
