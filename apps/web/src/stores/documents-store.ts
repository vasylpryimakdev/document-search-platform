import { create } from "zustand";
import { deleteDocument, listDocuments } from "../api";
import type { DocumentsState } from "../types/stores";
import { upsertDocument } from "../utils/documents";

let documentsRequestId = 0;

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  documentsError: "",
  isLoadingDocuments: false,
  deletingDocumentId: null,
  loadDocuments: async (userEmail) => {
    if (!userEmail) {
      return;
    }

    const requestId = ++documentsRequestId;

    set({ isLoadingDocuments: true, documentsError: "" });

    try {
      const response = await listDocuments(userEmail);

      if (requestId === documentsRequestId) {
        set({ documents: response.documents });
      }
    } catch (error) {
      if (requestId === documentsRequestId) {
        set({
          documentsError:
            error instanceof Error ? error.message : "Failed to load documents",
        });
      }
    } finally {
      if (requestId === documentsRequestId) {
        set({ isLoadingDocuments: false });
      }
    }
  },
  setDocumentsError: (documentsError) => set({ documentsError }),
  saveDocument: (document) =>
    set((state) => ({ documents: upsertDocument(state.documents, document) })),
  removeDocument: (documentId) =>
    set((state) => ({
      documents: state.documents.filter(
        (document) => document.id !== documentId,
      ),
    })),
  deleteUserDocument: async (userEmail, documentId) => {
    set({ deletingDocumentId: documentId, documentsError: "" });

    try {
      await deleteDocument(userEmail, documentId);
      get().removeDocument(documentId);
      return true;
    } catch (error) {
      set({
        documentsError:
          error instanceof Error ? error.message : "Failed to delete document",
      });
      return false;
    } finally {
      set({ deletingDocumentId: null });
    }
  },
  resetDocuments: () => {
    documentsRequestId += 1;
    set({
      documents: [],
      documentsError: "",
      isLoadingDocuments: false,
      deletingDocumentId: null,
    });
  },
}));
