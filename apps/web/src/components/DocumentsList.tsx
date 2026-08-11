import type { UserDocument } from '../api'
import { formatDate } from '../utils/format'

type DocumentsListProps = {
  documents: UserDocument[]
  isLoadingDocuments: boolean
  deletingDocumentId: string | null
  onDeleteDocument: (documentId: string) => void
}

export function DocumentsList({
  documents,
  isLoadingDocuments,
  deletingDocumentId,
  onDeleteDocument,
}: DocumentsListProps) {
  return (
    <section className="documents-list" aria-label="Uploaded documents">
      {isLoadingDocuments ? (
        <p className="empty-state">Loading documents...</p>
      ) : documents.length === 0 ? (
        <p className="empty-state">No documents uploaded in this session yet.</p>
      ) : (
        documents.map((document) => (
          <article className="document-card" key={document.id}>
            <div>
              <h3>{document.userFilename}</h3>
              <p>{formatDate(document.uploadedAt)}</p>
            </div>
            <div className="document-actions">
              <span className="status-badge">{document.status.toLowerCase()}</span>
              <button
                className="danger-button"
                type="button"
                disabled={deletingDocumentId === document.id}
                onClick={() => onDeleteDocument(document.id)}
              >
                {deletingDocumentId === document.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  )
}
