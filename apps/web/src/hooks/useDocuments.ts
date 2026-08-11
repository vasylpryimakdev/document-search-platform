import { useEffect, useState } from 'react'
import { deleteDocument, listDocuments, type UserDocument } from '../api'
import { upsertDocument } from '../utils/documents'

export function useDocuments(userEmail: string) {
  const [documents, setDocuments] = useState<UserDocument[]>([])
  const [documentsError, setDocumentsError] = useState('')
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null)

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

  function resetDocuments() {
    setDocuments([])
    setDocumentsError('')
    setDeletingDocumentId(null)
  }

  function saveDocument(document: UserDocument) {
    setDocuments((currentDocuments) => upsertDocument(currentDocuments, document))
  }

  function removeDocument(documentId: string) {
    setDocuments((currentDocuments) =>
      currentDocuments.filter((document) => document.id !== documentId),
    )
  }

  async function deleteUserDocument(documentId: string) {
    setDeletingDocumentId(documentId)
    setDocumentsError('')

    try {
      await deleteDocument(userEmail, documentId)
      removeDocument(documentId)
      return true
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : 'Failed to delete document')
      return false
    } finally {
      setDeletingDocumentId(null)
    }
  }

  return {
    documents,
    documentsError,
    isLoadingDocuments,
    deletingDocumentId,
    setDocumentsError,
    saveDocument,
    removeDocument,
    deleteUserDocument,
    resetDocuments,
  }
}
