import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
          <Card className="empty-state">Loading documents...</Card>
        ) : documents.length === 0 ? (
          <Card className="empty-state">No documents uploaded in this session yet.</Card>
        ) : (
        documents.map((document) => (
          <Card className="document-card" key={document.id}>
            <div>
              <h3>{document.userFilename}</h3>
              <p>{formatDate(document.uploadedAt)}</p>
            </div>
            <div className="document-actions">
              <Badge variant="secondary" className="status-badge">
                {document.status.toLowerCase()}
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                type="button"
                disabled={deletingDocumentId === document.id}
                onClick={() => onDeleteDocument(document.id)}
              >
                {deletingDocumentId === document.id ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        ))
      )}
    </section>
  )
}
