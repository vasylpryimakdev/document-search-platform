import { Alert } from '@/components/ui/alert'
import { useDocumentEvents } from '../hooks/useDocumentEvents'
import { useDocumentsStore } from '../stores/documents-store'
import { useUploadStore } from '../stores/upload-store'
import { DocumentsHeader } from './DocumentsHeader'
import { DocumentsList } from './DocumentsList'
import { SearchPanel } from './SearchPanel'
import { UploadPanel } from './UploadPanel'

export function DocumentsPage() {
  const uploadError = useUploadStore((state) => state.uploadError)
  const documentsError = useDocumentsStore((state) => state.documentsError)

  useDocumentEvents()

  return (
    <main className="documents-page">
      <DocumentsHeader />
      <UploadPanel />

      {uploadError ? <Alert className="upload-error" variant="destructive">{uploadError}</Alert> : null}
      {documentsError ? <Alert className="upload-error" variant="destructive">{documentsError}</Alert> : null}

      <SearchPanel />
      <DocumentsList />
    </main>
  )
}
