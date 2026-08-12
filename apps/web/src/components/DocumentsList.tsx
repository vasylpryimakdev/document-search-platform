import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { contentWidth, glassCard } from '../styles'
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
    <section className={`${contentWidth} mt-5 grid gap-3`} aria-label="Uploaded documents">
      {isLoadingDocuments ? (
        <Card className={`${glassCard} flex items-center gap-2.5 rounded-[20px] p-6 text-slate-300`}>
          <Loader />
        </Card>
      ) : documents.length === 0 ? (
        <Card className={`${glassCard} rounded-[20px] p-6 text-slate-300`}>No documents uploaded in this session yet.</Card>
      ) : (
        documents.map((document) => (
          <Card
            className={`${glassCard} grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[20px] p-[18px] max-md:grid-cols-1`}
            key={document.id}
          >
            <div className="flex self-stretch items-center border-r border-slate-400/20 pr-4 max-md:self-auto max-md:border-r-0 max-md:border-b max-md:pb-3 max-md:pr-0">
              <Badge
                variant="secondary"
                className={`w-fit uppercase tracking-[0.04em] ${document.status === 'INDEXED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
              >
                {document.status.toLowerCase()}
              </Badge>
            </div>
            <div className="grid gap-2">
              <h3 className="m-0 text-lg font-semibold">{document.userFilename}</h3>
              <p className="m-0 text-sm text-slate-300">{formatDate(document.uploadedAt)}</p>
            </div>
            <div className="flex items-center gap-2.5 max-md:flex-col max-md:items-stretch">
              <Button
                variant="destructive"
                size="sm"
                className="min-w-[72px]"
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
