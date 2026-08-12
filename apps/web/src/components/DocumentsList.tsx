import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { useAuthStore } from '../stores/auth-store'
import { useDocumentsStore } from '../stores/documents-store'
import { useSearchStore } from '../stores/search-store'
import { formatDate } from '../utils/format'

export function DocumentsList() {
  const userEmail = useAuthStore((state) => state.userEmail)
  const documents = useDocumentsStore((state) => state.documents)
  const isLoadingDocuments = useDocumentsStore((state) => state.isLoadingDocuments)
  const deletingDocumentId = useDocumentsStore((state) => state.deletingDocumentId)
  const deleteUserDocument = useDocumentsStore((state) => state.deleteUserDocument)
  const removeSearchResult = useSearchStore((state) => state.removeSearchResult)

  async function handleDeleteDocument(documentId: string) {
    const deleted = await deleteUserDocument(userEmail, documentId)

    if (deleted) {
      removeSearchResult(documentId)
    }
  }

  return (
    <section className="documents-list" aria-label="Uploaded documents">
      {isLoadingDocuments ? (
        <Card className="empty-state loading-state">
          <Loader />
        </Card>
      ) : documents.length === 0 ? (
        <Card className="empty-state">No documents uploaded in this session yet.</Card>
      ) : (
        documents.map((document) => (
          <Card className="document-card" key={document.id}>
            <div className="document-status-cell">
              <Badge variant="secondary" className={`status-badge status-badge-${document.status.toLowerCase()}`}>
                {document.status.toLowerCase()}
              </Badge>
            </div>
            <div className="document-details">
              <h3>{document.userFilename}</h3>
              <p>{formatDate(document.uploadedAt)}</p>
            </div>
            <div className="document-actions">
              <Button
                variant="destructive"
                size="sm"
                className="loading-button loading-button-sm"
                type="button"
                disabled={deletingDocumentId === document.id}
                onClick={() => void handleDeleteDocument(document.id)}
              >
                {deletingDocumentId === document.id ? <Loader /> : 'Delete'}
              </Button>
            </div>
          </Card>
        ))
      )}
    </section>
  )
}
