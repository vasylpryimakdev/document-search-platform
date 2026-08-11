import { randomUUID } from "node:crypto";
import path from "node:path";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { createUploadUrl } from "../lib/s3.js";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx"]);
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const documentsRouter = Router();

documentsRouter.post("/upload-url", async (req, res, next) => {
  try {
    const { userEmail, filename, contentType, size } = req.body as {
      userEmail?: unknown;
      filename?: unknown;
      contentType?: unknown;
      size?: unknown;
    };

    if (typeof userEmail !== "string" || !isValidEmail(userEmail)) {
      return res.status(400).json({ message: "Valid userEmail is required" });
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

    const bucket = process.env.S3_BUCKET_NAME;

    if (!bucket) {
      return res.status(500).json({ message: "S3 bucket is not configured" });
    }

    const documentId = randomUUID();
    const s3Filename = `documents/${sanitizeEmailForS3(userEmail)}/${documentId}${extension}`;

    const document = await prisma.document.create({
      data: {
        id: documentId,
        userEmail,
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

    return res.status(201).json({
      document,
      uploadUrl,
    });
  } catch (error) {
    return next(error);
  }
});

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeEmailForS3(email: string) {
  return email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
}
