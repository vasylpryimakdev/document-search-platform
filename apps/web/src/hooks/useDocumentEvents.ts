import { useEffect, useEffectEvent } from 'react'
import { API_URL, type UserDocument } from '../api'

type UseDocumentEventsInput = {
  userEmail: string
  onDocumentChanged: (document: UserDocument) => void
  onDocumentDeleted: (documentId: string) => void
  onConnectionError: (message: string) => void
}

export function useDocumentEvents({
  userEmail,
  onDocumentChanged,
  onDocumentDeleted,
  onConnectionError,
}: UseDocumentEventsInput) {
  const handleDocumentChanged = useEffectEvent(onDocumentChanged)
  const handleDocumentDeleted = useEffectEvent(onDocumentDeleted)
  const handleConnectionError = useEffectEvent(onConnectionError)

  useEffect(() => {
    if (!userEmail) {
      return
    }

    const searchParams = new URLSearchParams({ userEmail })
    const eventSource = new EventSource(`${API_URL}/events?${searchParams.toString()}`)

    eventSource.addEventListener('document_created', (event) => {
      const { document } = JSON.parse(event.data) as { document: UserDocument }
      handleDocumentChanged(document)
    })

    eventSource.addEventListener('document_status_updated', (event) => {
      const { document } = JSON.parse(event.data) as { document: UserDocument }
      handleDocumentChanged(document)
    })

    eventSource.addEventListener('document_deleted', (event) => {
      const { documentId } = JSON.parse(event.data) as { documentId: string }
      handleDocumentDeleted(documentId)
    })

    eventSource.onerror = () => {
      handleConnectionError('Live status connection failed. Refresh the page to reconnect.')
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [userEmail])
}
