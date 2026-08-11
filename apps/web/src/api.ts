const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export type DocumentStatus = 'PENDING' | 'INDEXED' | 'ERROR'

export type UserDocument = {
  id: string
  userFilename: string
  s3Filename?: string
  status: DocumentStatus
  uploadedAt: string
  indexedAt?: string | null
}

type CreateUploadUrlResponse = {
  document: UserDocument
  uploadUrl: string
}

export async function createUploadUrl(input: {
  userEmail: string
  filename: string
  contentType: string
  size: number
}) {
  const response = await fetch(`${API_URL}/documents/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json() as Promise<CreateUploadUrlResponse>
}

export async function uploadFileToS3(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!response.ok) {
    throw new Error('Failed to upload file to S3')
  }
}

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string }
    return body.message ?? 'Request failed'
  } catch {
    return 'Request failed'
  }
}
