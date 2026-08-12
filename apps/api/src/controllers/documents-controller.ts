import { randomUUID } from "node:crypto";
import path from "node:path";
import type { RequestHandler } from "express";
import { sendUserEvent } from "../lib/events.js";
import { deleteIndexedDocument, searchDocuments } from "../lib/opensearch.js";
import { prisma } from "../lib/prisma.js";
import { createUploadUrl, deleteObjectIfExists } from "../lib/s3.js";
import { getRequiredEnv } from "../config/env.js";
import { getRequiredParam, getRequiredQueryString, getUserEmail } from "../utils/request.js";
import { parseUserEmail } from "../utils/validation.js";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx"]);
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const searchUserDocuments: RequestHandler = async (req, res, next) => {
  try {
    const userEmail = getUserEmail(req);
    const query = getRequiredQueryString(req, "q");

    if ("error" in userEmail) {
      return res.status(400).json({ message: userEmail.error });
    }

    if ("error" in query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const results = await searchDocuments({
      userEmail: userEmail.value,
      query: query.value,
    });

    return res.json({ results });
  } catch (error) {
    return next(error);
  }
};

export const listUserDocuments: RequestHandler = async (req, res, next) => {
  try {
    const userEmail = getUserEmail(req);

    if ("error" in userEmail) {
      return res.status(400).json({ message: userEmail.error });
    }

    const documents = await prisma.document.findMany({
      where: { userEmail: userEmail.value },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        userFilename: true,
        status: true,
        uploadedAt: true,
        indexedAt: true,
      },
    });

    return res.json({ documents });
  } catch (error) {
    return next(error);
  }
};

export const deleteUserDocument: RequestHandler = async (req, res, next) => {
  try {
    const userEmail = getUserEmail(req);
    const documentId = getRequiredParam(req, "id");

    if ("error" in userEmail) {
      return res.status(400).json({ message: userEmail.error });
    }

    if ("error" in documentId) {
      return res.status(400).json({ message: "Document id is required" });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId.value,
        userEmail: userEmail.value,
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    await deleteObjectIfExists(document.s3Bucket, document.s3Filename);
    await deleteIndexedDocument(document.id);
    await prisma.document.delete({ where: { id: document.id } });

    sendUserEvent(userEmail.value, {
      type: "document_deleted",
      payload: { documentId: document.id },
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const createDocumentUploadUrl: RequestHandler = async (req, res, next) => {
  try {
    const { userEmail, filename, contentType, size } = req.body as {
      userEmail?: unknown;
      filename?: unknown;
      contentType?: unknown;
      size?: unknown;
    };

    const validUserEmail = parseUserEmail(userEmail);

    if ("error" in validUserEmail) {
      return res.status(400).json({ message: validUserEmail.error });
    }

    if (typeof filename !== "string" || filename.trim().length === 0) {
      return res.status(400).json({ message: "Filename is required" });
    }

    if (typeof contentType !== "string" || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      return res.status(400).json({ message: "Only PDF and DOCX files are allowed" });
    }

    if (typeof size !== "number" || !Number.isInteger(size) || size <= 0) {
      return res.status(400).json({ message: "Valid file size is required" });
    }

    if (size >= MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({ message: "File must be smaller than 10MB" });
    }

    const extension = path.extname(filename).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return res.status(400).json({ message: "Only .pdf and .docx files are allowed" });
    }

    const bucket = getRequiredEnv("S3_BUCKET_NAME");

    const documentId = randomUUID();
    const s3Filename = `documents/${sanitizeEmailForS3(validUserEmail.value)}/${documentId}${extension}`;

    const document = await prisma.document.create({
      data: {
        id: documentId,
        userEmail: validUserEmail.value,
        userFilename: filename,
        s3Filename,
        s3Bucket: bucket,
        mimeType: contentType,
        size,
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
      contentType,
    });

    sendUserEvent(validUserEmail.value, {
      type: "document_created",
      payload: { document },
    });

    return res.status(201).json({
      document,
      uploadUrl,
    });
  } catch (error) {
    return next(error);
  }
};

function sanitizeEmailForS3(email: string) {
  return email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
}
