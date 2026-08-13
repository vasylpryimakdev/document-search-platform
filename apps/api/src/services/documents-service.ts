import { randomUUID } from "node:crypto";
import { sendUserEvent } from "../lib/events.js";
import { deleteIndexedDocument, searchDocuments } from "../lib/opensearch.js";
import { prisma } from "../lib/prisma.js";
import { createDownloadUrl, createUploadUrl, deleteObjectIfExists } from "../lib/s3.js";
import { getRequiredEnv } from "../config/env.js";

type CreateUploadInput = {
  userEmail: string;
  userFilename: string;
  extension: string;
  contentType: string;
  size: number;
};

export async function searchUserDocumentsByContent(userEmail: string, query: string) {
  const results = await searchDocuments({ userEmail, query });
  const indexedDocuments = await prisma.document.findMany({
    where: {
      id: { in: results.map((result) => result.documentId) },
      userEmail,
      status: "INDEXED",
    },
    select: { id: true },
  });
  const indexedDocumentIds = new Set(
    indexedDocuments.map((document) => document.id),
  );

  return results.filter((result) => indexedDocumentIds.has(result.documentId));
}

export function listDocumentsByUser(userEmail: string) {
  return prisma.document.findMany({
    where: { userEmail },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      userFilename: true,
      status: true,
      uploadedAt: true,
      indexedAt: true,
    },
  });
}

export async function deleteDocumentForUser(userEmail: string, documentId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      userEmail,
    },
  });

  if (!document) {
    return false;
  }

  await deleteObjectIfExists(document.s3Bucket, document.s3Filename);
  await deleteIndexedDocument(document.id);
  await prisma.document.delete({ where: { id: document.id } });

  sendUserEvent(userEmail, {
    type: "document_deleted",
    payload: { documentId: document.id },
  });

  return true;
}

export async function createDocumentDownloadUrl(userEmail: string, documentId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      userEmail,
    },
    select: {
      s3Bucket: true,
      s3Filename: true,
      userFilename: true,
    },
  });

  if (!document) {
    return null;
  }

  return createDownloadUrl({
    bucket: document.s3Bucket,
    key: document.s3Filename,
    filename: document.userFilename,
  });
}

export async function createDocumentUpload(input: CreateUploadInput) {
  const bucket = getRequiredEnv("S3_BUCKET_NAME");
  const documentId = randomUUID();
  const s3Filename = `documents/${sanitizeEmailForS3(
    input.userEmail,
  )}/${documentId}${input.extension}`;

  const document = await prisma.document.create({
    data: {
      id: documentId,
      userEmail: input.userEmail,
      userFilename: input.userFilename,
      s3Filename,
      s3Bucket: bucket,
      mimeType: input.contentType,
      size: input.size,
    },
    select: {
      id: true,
      userFilename: true,
      s3Filename: true,
      status: true,
      uploadedAt: true,
    },
  });

  const uploadUrl = await createUploadUrl({
    bucket,
    key: s3Filename,
    contentType: input.contentType,
  });

  sendUserEvent(input.userEmail, {
    type: "document_created",
    payload: { document },
  });

  return { document, uploadUrl };
}

function sanitizeEmailForS3(email: string) {
  return email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
}
