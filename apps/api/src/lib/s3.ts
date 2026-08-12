import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";

export const s3Client = new S3Client({ region: process.env.AWS_REGION });

type CreateUploadUrlInput = {
  bucket: string;
  key: string;
  contentType: string;
};

export function createUploadUrl({ bucket, key, contentType }: CreateUploadUrlInput) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export async function getObjectBuffer(bucket: string, key: string) {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`S3 object ${key} has no body`);
  }

  return streamToBuffer(response.Body as Readable);
}

export async function deleteObject(bucket: string, key: string) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export async function deleteObjectIfExists(bucket: string, key: string) {
  try {
    await deleteObject(bucket, key);
  } catch (error) {
    if (isS3NotFoundError(error)) {
      return;
    }

    throw error;
  }
}

export async function objectExists(bucket: string, key: string) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (isS3NotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

function isS3NotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "$metadata" in error &&
    (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
  );
}

async function streamToBuffer(stream: Readable) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
