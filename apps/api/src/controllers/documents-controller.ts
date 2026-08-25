import path from "node:path";
import type { RequestHandler } from "express";
import {
  createDocumentDownloadUrl,
  createDocumentUpload,
  deleteDocumentForUser,
  listDocumentsByUser,
  searchUserDocumentsByContent,
} from "../services/documents-service.js";
import { getRequiredParam, getRequiredQueryString, getUserEmail } from "../utils/request.js";
import { parseUserEmail } from "../utils/validation.js";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const CONTENT_TYPES_BY_EXTENSION = new Map([
  [".pdf", "application/pdf"],
  [
    ".docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
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

    const results = await searchUserDocumentsByContent(userEmail.value, query.value);

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

    const documents = await listDocumentsByUser(userEmail.value);

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

    const deleted = await deleteDocumentForUser(userEmail.value, documentId.value);

    if (!deleted) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const createUserDocumentDownloadUrl: RequestHandler = async (req, res, next) => {
  try {
    const userEmail = getUserEmail(req);
    const documentId = getRequiredParam(req, "id");

    if ("error" in userEmail) {
      return res.status(400).json({ message: userEmail.error });
    }

    if ("error" in documentId) {
      return res.status(400).json({ message: "Document id is required" });
    }

    const downloadUrl = await createDocumentDownloadUrl(userEmail.value, documentId.value);

    if (!downloadUrl) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.json({ downloadUrl });
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

    if (typeof size !== "number" || !Number.isInteger(size) || size <= 0) {
      return res.status(400).json({ message: "Valid file size is required" });
    }

    if (size >= MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({ message: "File must be smaller than 10MB" });
    }

    const extension = path.extname(filename).toLowerCase();
    const expectedContentType = CONTENT_TYPES_BY_EXTENSION.get(extension);

    if (typeof contentType !== "string" || contentType !== expectedContentType) {
      return res.status(400).json({
        message: "File extension and content type must match a supported PDF or DOCX file",
      });
    }

    const { document, uploadUrl } = await createDocumentUpload({
      userEmail: validUserEmail.value,
      userFilename: filename,
      extension,
      contentType,
      size,
    });

    return res.status(201).json({
      document,
      uploadUrl,
    });
  } catch (error) {
    return next(error);
  }
};
