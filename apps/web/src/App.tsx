import { useState, type ChangeEvent, type FormEvent } from 'react'
import { createUploadUrl, searchDocuments, uploadFileToS3, type SearchResult } from './api'
import './App.css'
import { Alert } from './components/ui/alert'
import { AuthCard } from './components/AuthCard'
import { DocumentsHeader } from './components/DocumentsHeader'
import { DocumentsList } from './components/DocumentsList'
import { SearchPanel } from './components/SearchPanel'
import { UploadPanel } from './components/UploadPanel'
import { useDocumentEvents } from './hooks/useDocumentEvents'
import { useDocuments } from './hooks/useDocuments'
import { USER_EMAIL_STORAGE_KEY, isValidEmail } from './utils/auth'
import { validateFile } from './utils/documents'

function App() {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem(USER_EMAIL_STORAGE_KEY) ?? '')
  const [emailInput, setEmailInput] = useState(userEmail)
  const [emailError, setEmailError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchError, setSearchError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const {
    documents,
    documentsError,
    isLoadingDocuments,
    deletingDocumentId,
    setDocumentsError,
    saveDocument,
    removeDocument,
    deleteUserDocument,
    resetDocuments,
  } = useDocuments(userEmail)

  useDocumentEvents({
    userEmail,
    onDocumentChanged: saveDocument,
    onDocumentDeleted: removeDocumentFromState,
    onConnectionError: setDocumentsError,
  })

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = emailInput.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('Enter a valid email address')
      return
    }

    localStorage.setItem(USER_EMAIL_STORAGE_KEY, normalizedEmail)
    setUserEmail(normalizedEmail)
    setEmailError('')
  }

  function handleSignOut() {
    localStorage.removeItem(USER_EMAIL_STORAGE_KEY)
    setUserEmail('')
    setEmailInput('')
    setEmailError('')
    setUploadError('')
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')
    resetDocuments()
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
      saveDocument(document)
    } catch (uploadError) {
      setUploadError(uploadError instanceof Error ? uploadError.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = searchQuery.trim()

    if (!query) {
      setSearchError('Enter text to search')
      return
    }

    setIsSearching(true)
    setSearchError('')

    try {
      const response = await searchDocuments(userEmail, query)
      setSearchResults(response.results)
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Failed to search documents')
    } finally {
      setIsSearching(false)
    }
  }

  async function handleDeleteDocument(documentId: string) {
    const deleted = await deleteUserDocument(documentId)

    if (deleted) {
      removeDocumentFromSearchResults(documentId)
    }
  }

  function removeDocumentFromState(documentId: string) {
    removeDocument(documentId)
    removeDocumentFromSearchResults(documentId)
  }

  function removeDocumentFromSearchResults(documentId: string) {
    setSearchResults((currentResults) =>
      currentResults.filter((result) => result.documentId !== documentId),
    )
  }

  if (!userEmail) {
    return (
      <AuthCard
        emailInput={emailInput}
        error={emailError}
        onEmailInputChange={setEmailInput}
        onSubmit={handleEmailSubmit}
      />
    )
  }

  return (
    <main className="documents-page">
      <DocumentsHeader userEmail={userEmail} onSignOut={handleSignOut} />
      <UploadPanel isUploading={isUploading} onFileChange={handleFileChange} />

      {uploadError ? <Alert className="upload-error" variant="destructive">{uploadError}</Alert> : null}
      {documentsError ? <Alert className="upload-error" variant="destructive">{documentsError}</Alert> : null}

      <SearchPanel
        searchQuery={searchQuery}
        searchResults={searchResults}
        searchError={searchError}
        isSearching={isSearching}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />
      <DocumentsList
        documents={documents}
        isLoadingDocuments={isLoadingDocuments}
        deletingDocumentId={deletingDocumentId}
        onDeleteDocument={(documentId) => void handleDeleteDocument(documentId)}
      />
    </main>
  )
}

export default App
