import { Alert } from '@/components/ui/alert'
import { useDocumentEvents } from '../hooks/useDocumentEvents'
import { contentWidth, documentsBackground } from '../styles'
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
    <main className={documentsBackground}>
      <DocumentsHeader />
      <UploadPanel />

      {uploadError ? <Alert className={`${contentWidth} mt-4 box-border`} variant="destructive">{uploadError}</Alert> : null}
      {documentsError ? <Alert className={`${contentWidth} mt-4 box-border`} variant="destructive">{documentsError}</Alert> : null}

      <SearchPanel />
      <DocumentsList />
    </main>
  )
}
