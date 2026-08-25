import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Download, FileText, Trash2 } from "lucide-react";
import { createDownloadUrl } from "../api";
import { contentWidth, glassCard } from "../styles";
import { useAuthStore } from "../stores/auth-store";
import { useDocumentsStore } from "../stores/documents-store";
import { useSearchStore } from "../stores/search-store";
import { formatDate, renderHighlight } from "../utils/format";

export function DocumentsList() {
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const userEmail = useAuthStore((state) => state.userEmail);
  const documents = useDocumentsStore((state) => state.documents);
  const isLoadingDocuments = useDocumentsStore(
    (state) => state.isLoadingDocuments,
  );
  const deletingDocumentId = useDocumentsStore(
    (state) => state.deletingDocumentId,
  );
  const deleteUserDocument = useDocumentsStore(
    (state) => state.deleteUserDocument,
  );
  const removeSearchResult = useSearchStore(
    (state) => state.removeSearchResult,
  );
  const searchResults = useSearchStore((state) => state.searchResults);
  const searchError = useSearchStore((state) => state.searchError);
  const hasSearched = useSearchStore((state) => state.hasSearched);
  const searchResultsByDocumentId = new Map(
    searchResults.map((result) => [result.documentId, result]),
  );
  const hasActiveSearch = hasSearched && !searchError;
  const visibleDocuments = hasActiveSearch
    ? documents.filter((document) => searchResultsByDocumentId.has(document.id))
    : documents;

  async function handleDeleteDocument(documentId: string) {
    const deleted = await deleteUserDocument(userEmail, documentId);

    if (deleted) {
      removeSearchResult(documentId);
    }
  }

  async function handleDownloadDocument(documentId: string) {
    setDownloadingDocumentId(documentId);

    try {
      const { downloadUrl } = await createDownloadUrl(userEmail, documentId);
      window.location.assign(downloadUrl);
    } catch (error) {
      useDocumentsStore
        .getState()
        .setDocumentsError(
          error instanceof Error ? error.message : "Failed to download document",
        );
    } finally {
      setDownloadingDocumentId(null);
    }
  }

  return (
    <section
      className={`${contentWidth} mt-5 grid gap-3`}
      aria-label="Uploaded documents"
    >
      {isLoadingDocuments ? (
        <Card
          className={`${glassCard} flex items-center gap-2.5 rounded-[20px] p-6 text-slate-300`}
        >
          <Loader />
        </Card>
      ) : visibleDocuments.length === 0 ? (
        <Card className={`${glassCard} rounded-[20px] p-6 text-slate-300`}>
          {hasActiveSearch
            ? "No matching documents found."
            : "No documents uploaded in this session yet."}
        </Card>
      ) : (
        <Card className={`${glassCard} overflow-hidden rounded-3xl p-0`}>
          <div className="grid grid-cols-[minmax(220px,1.2fr)_130px_190px_minmax(280px,1fr)_96px] items-center gap-5 border-b border-slate-400/20 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-300 max-lg:hidden">
            <span>Document</span>
            <span>Status</span>
            <span>Upload Date</span>
            <span>Content Preview</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-slate-400/12">
            {visibleDocuments.map((document) => {
              const searchResult = searchResultsByDocumentId.get(document.id);
              const preview = searchResult?.highlights[0];

              return (
                <article
                  className="grid grid-cols-[minmax(220px,1.2fr)_130px_190px_minmax(280px,1fr)_96px] items-center gap-5 px-5 py-4 transition-colors hover:bg-slate-800/45 max-lg:grid-cols-1 max-lg:gap-3"
                  key={document.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-300">
                      <FileText size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="m-0 truncate text-base font-semibold text-slate-50">
                        {document.userFilename}
                      </h3>
                      <p className="mt-1 truncate font-mono text-xs text-slate-400">
                        ID: {document.id}
                      </p>
                    </div>
                  </div>

                  <div className="max-lg:flex max-lg:items-center max-lg:justify-between">
                    <span className="hidden text-sm font-semibold text-slate-400 max-lg:block">
                      Status
                    </span>
                    <div className="min-w-0">
                      <Badge
                        variant="secondary"
                        className={`w-fit uppercase tracking-[0.04em] ${getStatusBadgeClassName(document.status)}`}
                      >
                        {document.status.toLowerCase()}
                      </Badge>
                      {document.status === "ERROR" && document.errorMessage ? (
                        <p className="mt-1 max-w-52 wrap-break-word text-xs leading-4 text-red-300">
                          {document.errorMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-sm text-slate-200 max-lg:flex max-lg:items-center max-lg:justify-between">
                    <span className="hidden font-semibold text-slate-400 max-lg:block">
                      Upload Date
                    </span>
                    <span>{formatDate(document.uploadedAt)}</span>
                  </div>

                  <div className="min-w-0 text-sm leading-6 text-slate-300 max-lg:border-t max-lg:border-slate-400/12 max-lg:pt-3">
                    {preview ? (
                      <p className="m-0 line-clamp-2">
                        {renderHighlight(preview)}
                      </p>
                    ) : (
                      <p className="m-0 text-slate-500">
                        Search this document to show matching text preview.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sky-300 hover:bg-sky-500/10 hover:text-sky-200"
                      type="button"
                      aria-label={`Download ${document.userFilename}`}
                      disabled={downloadingDocumentId === document.id}
                      onClick={() => void handleDownloadDocument(document.id)}
                    >
                      {downloadingDocumentId === document.id ? (
                        <Loader />
                      ) : (
                        <Download size={17} aria-hidden="true" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                      type="button"
                      aria-label={`Delete ${document.userFilename}`}
                      disabled={deletingDocumentId === document.id}
                      onClick={() => void handleDeleteDocument(document.id)}
                    >
                      {deletingDocumentId === document.id ? (
                        <Loader />
                      ) : (
                        <Trash2 size={17} aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>
      )}
    </section>
  );
}

function getStatusBadgeClassName(status: string) {
  if (status === "INDEXED") {
    return "bg-green-100 text-green-800";
  }

  if (status === "ERROR") {
    return "bg-red-100 text-red-800";
  }

  return "bg-amber-100 text-amber-800";
}
