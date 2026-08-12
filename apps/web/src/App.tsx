import { useEffect, type ChangeEvent, type FormEvent } from 'react'
import './App.css'
import { Alert } from './components/ui/alert'
import { AuthCard } from './components/AuthCard'
import { DocumentsHeader } from './components/DocumentsHeader'
import { DocumentsList } from './components/DocumentsList'
import { SearchPanel } from './components/SearchPanel'
import { UploadPanel } from './components/UploadPanel'
import { useDocumentEvents } from './hooks/useDocumentEvents'
import { useAuthStore } from './stores/auth-store'
import { useDocumentsStore } from './stores/documents-store'
import { useSearchStore } from './stores/search-store'
import { useUploadStore } from './stores/upload-store'

function App() {
  const userEmail = useAuthStore((state) => state.userEmail)
  const emailInput = useAuthStore((state) => state.emailInput)
  const emailError = useAuthStore((state) => state.emailError)
  const setEmailInput = useAuthStore((state) => state.setEmailInput)
  const submitEmail = useAuthStore((state) => state.submitEmail)
  const signOut = useAuthStore((state) => state.signOut)
  const uploadError = useUploadStore((state) => state.uploadError)
  const isUploading = useUploadStore((state) => state.isUploading)
  const uploadDocument = useUploadStore((state) => state.uploadDocument)
  const resetUpload = useUploadStore((state) => state.resetUpload)
  const documents = useDocumentsStore((state) => state.documents)
  const documentsError = useDocumentsStore((state) => state.documentsError)
  const isLoadingDocuments = useDocumentsStore((state) => state.isLoadingDocuments)
  const deletingDocumentId = useDocumentsStore((state) => state.deletingDocumentId)
  const setDocumentsError = useDocumentsStore((state) => state.setDocumentsError)
  const saveDocument = useDocumentsStore((state) => state.saveDocument)
  const removeDocument = useDocumentsStore((state) => state.removeDocument)
  const resetDocuments = useDocumentsStore((state) => state.resetDocuments)
  const loadDocuments = useDocumentsStore((state) => state.loadDocuments)
  const deleteUserDocument = useDocumentsStore((state) => state.deleteUserDocument)
  const searchQuery = useSearchStore((state) => state.searchQuery)
  const searchResults = useSearchStore((state) => state.searchResults)
  const searchError = useSearchStore((state) => state.searchError)
  const isSearching = useSearchStore((state) => state.isSearching)
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery)
  const searchUserDocuments = useSearchStore((state) => state.searchUserDocuments)
  const removeSearchResult = useSearchStore((state) => state.removeSearchResult)
  const resetSearch = useSearchStore((state) => state.resetSearch)

  useEffect(() => {
    void loadDocuments(userEmail)
  }, [loadDocuments, userEmail])

  useDocumentEvents({
    userEmail,
    onDocumentChanged: saveDocument,
    onDocumentDeleted: removeDocumentFromState,
    onConnectionError: setDocumentsError,
  })

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitEmail()
  }

  function handleSignOut() {
    signOut()
    resetUpload()
    resetSearch()
    resetDocuments()
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    await uploadDocument(userEmail, file)
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    void searchUserDocuments(userEmail)
  }

  async function handleDeleteDocument(documentId: string) {
    const deleted = await deleteUserDocument(userEmail, documentId)

    if (deleted) {
      removeDocumentFromSearchResults(documentId)
    }
  }

  function removeDocumentFromState(documentId: string) {
    removeDocument(documentId)
    removeDocumentFromSearchResults(documentId)
  }

  function removeDocumentFromSearchResults(documentId: string) {
    removeSearchResult(documentId)
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
