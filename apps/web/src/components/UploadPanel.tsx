import { useRef, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { useAuthStore } from '../stores/auth-store'
import { useUploadStore } from '../stores/upload-store'

export function UploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userEmail = useAuthStore((state) => state.userEmail)
  const isUploading = useUploadStore((state) => state.isUploading)
  const uploadDocument = useUploadStore((state) => state.uploadDocument)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    await uploadDocument(userEmail, file)
  }

  return (
    <Card className="documents-panel" aria-labelledby="documents-title">
      <div>
        <h2 id="documents-title">Your documents</h2>
        <p>Upload one PDF or DOCX file under 10MB. New uploads appear as pending.</p>
      </div>
      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
      />
      <Button type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
        {isUploading ? <><Loader /> Uploading</> : 'Upload'}
      </Button>
    </Card>
  )
}
