import { useEffect, useEffectEvent } from "react";
import { API_URL, type UserDocument } from "../api";
import { useAuthStore } from "../stores/auth-store";
import { useDocumentsStore } from "../stores/documents-store";
import { useSearchStore } from "../stores/search-store";

export function useDocumentEvents() {
  const userEmail = useAuthStore((state) => state.userEmail);
  const loadDocuments = useDocumentsStore((state) => state.loadDocuments);
  const saveDocument = useDocumentsStore((state) => state.saveDocument);
  const removeDocument = useDocumentsStore((state) => state.removeDocument);
  const setDocumentsError = useDocumentsStore(
    (state) => state.setDocumentsError,
  );
  const removeSearchResult = useSearchStore(
    (state) => state.removeSearchResult,
  );

  const handleDocumentChanged = useEffectEvent(saveDocument);
  const handleDocumentDeleted = useEffectEvent((documentId: string) => {
    removeDocument(documentId);
    removeSearchResult(documentId);
  });
  const handleConnectionError = useEffectEvent(setDocumentsError);

  useEffect(() => {
    void loadDocuments(userEmail);
  }, [loadDocuments, userEmail]);

  useEffect(() => {
    if (!userEmail) {
      return;
    }

    const searchParams = new URLSearchParams({ userEmail });
    const eventSource = new EventSource(
      `${API_URL}/events?${searchParams.toString()}`,
    );

    eventSource.addEventListener("document_created", (event) => {
      const { document } = JSON.parse(event.data) as { document: UserDocument };
      handleDocumentChanged(document);
    });

    eventSource.addEventListener("document_status_updated", (event) => {
      const { document } = JSON.parse(event.data) as { document: UserDocument };
      handleDocumentChanged(document);
    });

    eventSource.addEventListener("document_deleted", (event) => {
      const { documentId } = JSON.parse(event.data) as { documentId: string };
      handleDocumentDeleted(documentId);
    });

    eventSource.onerror = () => {
      handleConnectionError(
        "Live status connection failed. Refresh the page to reconnect.",
      );
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [userEmail]);
}
