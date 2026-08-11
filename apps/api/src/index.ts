import cors from "cors";
import "dotenv/config";
import express from "express";
import { documentsRouter } from "./routes/documents.js";
import { eventsRouter } from "./routes/events.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
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

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
