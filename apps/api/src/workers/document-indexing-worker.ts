import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  type Message,
} from "@aws-sdk/client-sqs";
import { sendUserEvent } from "../lib/events.js";
import {
  parseDocument,
  validateDocumentSignature,
} from "../lib/document-parser.js";
import { deleteIndexedDocument, indexDocument } from "../lib/opensearch.js";
import { prisma } from "../lib/prisma.js";
import { getObjectBuffer, objectExists } from "../lib/s3.js";
import { getRequiredEnv } from "../config/env.js";

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
});

type S3EventMessage = {
  Records?: Array<{
    s3?: {
      bucket?: { name?: string };
      object?: { key?: string };
    };
  }>;
};

export function startDocumentIndexingWorker() {
  const queueUrl = getRequiredEnv("SQS_QUEUE_URL");

  let stopped = false;

  const poll = async () => {
    while (!stopped) {
      try {
        const response = await sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 5,
            WaitTimeSeconds: 20,
            VisibilityTimeout: 120,
          }),
        );

        for (const message of response.Messages ?? []) {
          await processMessage(queueUrl, message);
        }
      } catch (error) {
        console.error("Document indexing worker failed to poll SQS", error);
        await delay(5000);
      }
    }
  };

  void poll();

  return () => {
    stopped = true;
  };
}

async function processMessage(queueUrl: string, message: Message) {
  try {
    const records = parseS3Records(message.Body);

    for (const record of records) {
      await processS3Object(record.bucket, record.key);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Skipping malformed SQS message", error);
    } else {
      throw error;
    }
  }

  if (message.ReceiptHandle) {
    await sqsClient.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );
  }
}

async function processS3Object(bucket: string, key: string) {
  const document = await prisma.document.findUnique({
    where: { s3Filename: key },
  });

  if (!document) {
    if (!(await objectExists(bucket, key))) {
      console.warn(
        `Skipping deleted S3 object without matching document: ${bucket}/${key}`,
      );
      return;
    }

    throw new MissingDocumentRecordError(bucket, key);
  }

  const documentStillExists = await prisma.document.findUnique({
    where: { id: document.id },
    select: { id: true },
  });

  if (!documentStillExists) {
    await deleteIndexedDocument(document.id);
    return;
  }

  try {
    const file = await getObjectBuffer(bucket, key);
    validateDocumentSignature(file, document.userFilename);

    const content = await parseDocument(file, document.userFilename);

    await indexDocument({
      documentId: document.id,
      userEmail: document.userEmail,
      userFilename: document.userFilename,
      content,
      uploadedAt: document.uploadedAt,
    });

    const updateResult = await prisma.document.updateMany({
      where: { id: document.id },
      data: {
        status: "INDEXED",
        indexedAt: new Date(),
        errorMessage: null,
      },
    });

    if (updateResult.count === 0) {
      await deleteIndexedDocument(document.id);
      return;
    }

    const updatedDocument = await prisma.document.findUnique({
      where: { id: document.id },
      select: {
        id: true,
        userFilename: true,
        status: true,
        uploadedAt: true,
        indexedAt: true,
      },
    });

    if (!updatedDocument) {
      await deleteIndexedDocument(document.id);
      return;
    }

    sendUserEvent(document.userEmail, {
      type: "document_status_updated",
      payload: { document: updatedDocument },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown indexing error";
    const updateResult = await prisma.document.updateMany({
      where: { id: document.id },
      data: {
        status: "ERROR",
        errorMessage: message,
      },
    });

    if (updateResult.count === 0) {
      await deleteIndexedDocument(document.id);
      return;
    }

    const updatedDocument = await prisma.document.findUnique({
      where: { id: document.id },
      select: {
        id: true,
        userFilename: true,
        status: true,
        uploadedAt: true,
        indexedAt: true,
        errorMessage: true,
      },
    });

    if (!updatedDocument) {
      return;
    }

    sendUserEvent(document.userEmail, {
      type: "document_status_updated",
      payload: { document: updatedDocument },
    });

    if (isRetryableIndexingError(error)) {
      throw error;
    }
  }
}

function isRetryableIndexingError(error: unknown) {
  if (!(error instanceof Error)) {
    return true;
  }

  return !isPermanentDocumentError(error);
}

function isPermanentDocumentError(error: Error) {
  return (
    error.message.startsWith("Uploaded file content does not match") ||
    error.message.startsWith("Unsupported document extension")
  );
}

function parseS3Records(body: string | undefined) {
  if (!body) {
    return [];
  }

  const message = JSON.parse(body) as S3EventMessage;

  return (message.Records ?? []).flatMap((record) => {
    const bucket = record.s3?.bucket?.name;
    const key = record.s3?.object?.key;

    if (!bucket || !key) {
      return [];
    }

    return [{ bucket, key: decodeS3ObjectKey(key) }];
  });
}

function decodeS3ObjectKey(key: string) {
  return decodeURIComponent(key.replace(/\+/g, " "));
}

class MissingDocumentRecordError extends Error {
  constructor(bucket: string, key: string) {
    super(`S3 object has no matching document record yet: ${bucket}/${key}`);
    this.name = "MissingDocumentRecordError";
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
