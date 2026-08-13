import type {
  CreateUploadUrlInput,
  CreateUploadUrlResponse,
  CreateDownloadUrlResponse,
  ListDocumentsResponse,
  SearchDocumentsResponse,
} from "./types/api";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function listDocuments(userEmail: string) {
  const searchParams = new URLSearchParams({ userEmail });
  const response = await fetch(
    `${API_URL}/documents?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<ListDocumentsResponse>;
}

export async function createUploadUrl(input: CreateUploadUrlInput) {
  const response = await fetch(`${API_URL}/documents/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<CreateUploadUrlResponse>;
}

export async function searchDocuments(userEmail: string, query: string) {
  const searchParams = new URLSearchParams({ userEmail, q: query });
  const response = await fetch(
    `${API_URL}/documents/search?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<SearchDocumentsResponse>;
}

export async function deleteDocument(userEmail: string, documentId: string) {
  const searchParams = new URLSearchParams({ userEmail });
  const response = await fetch(
    `${API_URL}/documents/${documentId}?${searchParams.toString()}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function createDownloadUrl(userEmail: string, documentId: string) {
  const searchParams = new URLSearchParams({ userEmail });
  const response = await fetch(
    `${API_URL}/documents/${documentId}/download-url?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<CreateDownloadUrlResponse>;
}

export async function uploadFileToS3(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file to S3");
  }
}

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? "Request failed";
  } catch {
    return "Request failed";
  }
}
