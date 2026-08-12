import type { SearchResult, UserDocument } from "./documents";

export type CreateUploadUrlInput = {
  userEmail: string;
  filename: string;
  contentType: string;
  size: number;
};

export type CreateUploadUrlResponse = {
  document: UserDocument;
  uploadUrl: string;
};

export type ListDocumentsResponse = {
  documents: UserDocument[];
};

export type SearchDocumentsResponse = {
  results: SearchResult[];
};
