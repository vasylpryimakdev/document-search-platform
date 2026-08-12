import { useRef, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type UploadPanelProps = {
  isUploading: boolean
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function UploadPanel({ isUploading, onFileChange }: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        onChange={onFileChange}
      />
      <Button type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </Button>
    </Card>
  )
}
