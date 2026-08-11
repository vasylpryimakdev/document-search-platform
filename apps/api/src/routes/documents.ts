import { Router } from "express";
import {
  createDocumentUploadUrl,
  deleteUserDocument,
  listUserDocuments,
  searchUserDocuments,
} from "../controllers/documents-controller.js";

export const documentsRouter = Router();

documentsRouter.get("/search", searchUserDocuments);
documentsRouter.get("/", listUserDocuments);
documentsRouter.delete("/:id", deleteUserDocument);
documentsRouter.post("/upload-url", createDocumentUploadUrl);
