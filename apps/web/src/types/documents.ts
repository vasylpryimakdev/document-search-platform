export type DocumentStatus = "PENDING" | "INDEXED" | "ERROR";

export type UserDocument = {
  id: string;
  userFilename: string;
  s3Filename?: string;
  status: DocumentStatus;
  errorMessage?: string | null;
  uploadedAt: string;
  indexedAt?: string | null;
};

export type SearchResult = {
  documentId: string;
  userFilename: string;
  uploadedAt: string | null;
  highlights: string[];
};
