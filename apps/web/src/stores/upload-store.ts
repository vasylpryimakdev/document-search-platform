import { create } from "zustand";
import { createUploadUrl, uploadFileToS3 } from "../api";
import { validateFile } from "../utils/documents";
import { useDocumentsStore } from "./documents-store";

type UploadState = {
  uploadError: string;
  isUploading: boolean;
  uploadDocument: (userEmail: string, file: File) => Promise<void>;
  resetUpload: () => void;
};

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

      await uploadFileToS3(uploadUrl, file);
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
