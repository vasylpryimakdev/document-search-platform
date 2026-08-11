import type { UserDocument } from '../api'

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
export const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx'])

export function validateFile(file: File) {
  const extension = getFileExtension(file.name)

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return 'Only .pdf and .docx files are allowed'
  }

  if (file.size >= MAX_FILE_SIZE_BYTES) {
    return 'File must be smaller than 10MB'
  }

  return ''
}

export function upsertDocument(documents: UserDocument[], nextDocument: UserDocument) {
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
