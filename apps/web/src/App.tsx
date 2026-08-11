import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { API_URL, createUploadUrl, listDocuments, uploadFileToS3, type UserDocument } from './api'
import './App.css'

const USER_EMAIL_STORAGE_KEY = 'document-search:user-email'
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx'])

function App() {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem(USER_EMAIL_STORAGE_KEY) ?? '')
  const [emailInput, setEmailInput] = useState(userEmail)
  const [error, setError] = useState('')
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [documentsError, setDocumentsError] = useState('')
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userEmail) {
      return
    }

    let ignore = false

    async function loadDocuments() {
      setIsLoadingDocuments(true)
      setDocumentsError('')

      try {
        const response = await listDocuments(userEmail)

        if (!ignore) {
          setDocuments(response.documents)
        }
      } catch (error) {
        if (!ignore) {
          setDocumentsError(error instanceof Error ? error.message : 'Failed to load documents')
        }
      } finally {
        if (!ignore) {
          setIsLoadingDocuments(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      ignore = true
    }
  }, [userEmail])

  useEffect(() => {
    if (!userEmail) {
      return
    }

    const searchParams = new URLSearchParams({ userEmail })
    const eventSource = new EventSource(`${API_URL}/events?${searchParams.toString()}`)

    eventSource.addEventListener('document_created', (event) => {
      const { document } = JSON.parse(event.data) as { document: UserDocument }
      setDocuments((currentDocuments) => upsertDocument(currentDocuments, document))
    })

    eventSource.addEventListener('document_status_updated', (event) => {
      const { document } = JSON.parse(event.data) as { document: UserDocument }
      setDocuments((currentDocuments) => upsertDocument(currentDocuments, document))
    })

    eventSource.addEventListener('document_deleted', (event) => {
      const { documentId } = JSON.parse(event.data) as { documentId: string }
      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document.id !== documentId),
      )
    })

    eventSource.onerror = () => {
      setDocumentsError('Live status connection failed. Refresh the page to reconnect.')
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [userEmail])

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = emailInput.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError('Enter a valid email address')
      return
    }

    localStorage.setItem(USER_EMAIL_STORAGE_KEY, normalizedEmail)
    setUserEmail(normalizedEmail)
    setError('')
  }

  function handleSignOut() {
    localStorage.removeItem(USER_EMAIL_STORAGE_KEY)
    setUserEmail('')
    setEmailInput('')
    setError('')
    setDocuments([])
    setDocumentsError('')
    setUploadError('')
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const validationError = validateFile(file)

    if (validationError) {
      setUploadError(validationError)
      return
    }

    setIsUploading(true)
    setUploadError('')

    try {
      const { document, uploadUrl } = await createUploadUrl({
        userEmail,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      })

      await uploadFileToS3(uploadUrl, file)
      setDocuments((currentDocuments) => upsertDocument(currentDocuments, document))
    } catch (uploadError) {
      setUploadError(uploadError instanceof Error ? uploadError.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  if (!userEmail) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="auth-title">
          <p className="eyebrow">Document Search Platform</p>
          <h1 id="auth-title">Start with your email</h1>
          <p className="auth-copy">
            This demo stores your email locally to emulate authentication before document upload.
          </p>

          <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={emailInput}
              placeholder="you@example.com"
              onChange={(event) => setEmailInput(event.target.value)}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'email-error' : undefined}
            />
            {error ? (
              <p className="field-error" id="email-error">
                {error}
              </p>
            ) : null}
            <button type="submit">Continue</button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="documents-page">
      <header className="documents-header">
        <div>
          <p className="eyebrow">Signed in as</p>
          <h1>{userEmail}</h1>
        </div>
        <button className="secondary-button" type="button" onClick={handleSignOut}>
          Change email
        </button>
      </header>

      <section className="documents-panel" aria-labelledby="documents-title">
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
        <button type="button" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </section>

      {uploadError ? <p className="upload-error">{uploadError}</p> : null}
      {documentsError ? <p className="upload-error">{documentsError}</p> : null}

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
              <span className="status-badge">{document.status.toLowerCase()}</span>
            </article>
          ))
        )}
      </section>
    </main>
  )
}

function validateFile(file: File) {
  const extension = getFileExtension(file.name)

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return 'Only .pdf and .docx files are allowed'
  }

  if (file.size >= MAX_FILE_SIZE_BYTES) {
    return 'File must be smaller than 10MB'
  }

  return ''
}

function upsertDocument(documents: UserDocument[], nextDocument: UserDocument) {
  const existingIndex = documents.findIndex((document) => document.id === nextDocument.id)

  if (existingIndex === -1) {
    return [nextDocument, ...documents]
  }

  return documents.map((document, index) => (index === existingIndex ? nextDocument : document))
}

function getFileExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf('.')
  return lastDotIndex >= 0 ? filename.slice(lastDotIndex).toLowerCase() : ''
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default App
