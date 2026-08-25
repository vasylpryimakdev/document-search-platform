import { create } from "zustand";
import { createUploadUrl, deleteDocument, uploadFileToS3 } from "../api";
import type { UploadState } from "../types/stores";
import { validateFile } from "../utils/documents";
import { useDocumentsStore } from "./documents-store";

export const useUploadStore = create<UploadState>((set) => ({
  uploadError: "",
  isUploading: false,
  uploadDocument: async (userEmail, file) => {
    const validationError = validateFile(file);

    if (validationError) {
      set({ uploadError: validationError });
      return;
    }

    set({ isUploading: true, uploadError: "" });

    try {
      const { document, uploadUrl } = await createUploadUrl({
        userEmail,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });

      try {
        await uploadFileToS3(uploadUrl, file);
      } catch (error) {
        try {
          await deleteDocument(userEmail, document.id);
        } catch (cleanupError) {
          console.error("Failed to clean up document after S3 upload failure", cleanupError);
        }

        throw error;
      }

      useDocumentsStore.getState().saveDocument(document);
    } catch (error) {
      set({
        uploadError:
          error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      set({ isUploading: false });
    }
  },
  resetUpload: () => set({ uploadError: "", isUploading: false }),
}));
