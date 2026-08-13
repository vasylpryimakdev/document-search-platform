import dotenv from "dotenv";

const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";

if (appEnv) {
  dotenv.config({ path: `.env.${appEnv}` });
}

dotenv.config();

const { createApp } = await import("./app.js");

const port = Number(process.env.PORT ?? 3001);
const app = createApp();

app.listen(port, async () => {
  console.log(`API server listening on port ${port}`);

  if (process.env.WORKER_ENABLED === "true") {
    const { startDocumentIndexingWorker } = await import("./workers/document-indexing-worker.js");
    startDocumentIndexingWorker();
    console.log("Document indexing worker started");
  }
});
