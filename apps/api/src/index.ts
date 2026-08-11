import cors from "cors";
import "dotenv/config";
import express from "express";
import { documentsRouter } from "./routes/documents.js";
import { eventsRouter } from "./routes/events.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use((req, res, next) => {
  if (req.path === "/health") {
    return next();
  }

  const origin = req.get("origin");

  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ message: "Origin is not allowed" });
  }

  if (!origin && isBrowserNavigation(req)) {
    return res.status(403).json({ message: "Browser access to API is not allowed" });
  }

  return next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  }),
);
app.use(express.json());

app.use("/documents", documentsRouter);
app.use("/events", eventsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

function isBrowserNavigation(req: express.Request) {
  return req.get("sec-fetch-mode") === "navigate";
}

app.listen(port, async () => {
  console.log(`API server listening on port ${port}`);

  if (process.env.WORKER_ENABLED === "true") {
    const { startDocumentIndexingWorker } = await import("./workers/document-indexing-worker.js");
    startDocumentIndexingWorker();
    console.log("Document indexing worker started");
  }
});
