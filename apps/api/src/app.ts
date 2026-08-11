import express from "express";
import { corsMiddleware } from "./config/cors.js";
import { originGuard } from "./middleware/origin-guard.js";
import { documentsRouter } from "./routes/documents.js";
import { eventsRouter } from "./routes/events.js";

export function createApp() {
  const app = express();

  app.use(originGuard);
  app.use(corsMiddleware);
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

  return app;
}
