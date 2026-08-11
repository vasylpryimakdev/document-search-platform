import "dotenv/config";
import { createApp } from "./app.js";

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
