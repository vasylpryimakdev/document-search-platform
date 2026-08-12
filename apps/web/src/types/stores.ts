import type { SearchResult, UserDocument } from "./documents";

export type AuthState = {
  userEmail: string;
  emailInput: string;
  emailError: string;
  setEmailInput: (emailInput: string) => void;
  submitEmail: () => boolean;
  signOut: () => void;
};

export type DocumentsState = {
  documents: UserDocument[];
  documentsError: string;
  isLoadingDocuments: boolean;
  deletingDocumentId: string | null;
  loadDocuments: (userEmail: string) => Promise<void>;
  setDocumentsError: (documentsError: string) => void;
  saveDocument: (document: UserDocument) => void;
  removeDocument: (documentId: string) => void;
  deleteUserDocument: (userEmail: string, documentId: string) => Promise<boolean>;
  resetDocuments: () => void;
};

export type SearchState = {
  searchQuery: string;
  searchResults: SearchResult[];
  searchError: string;
  isSearching: boolean;
  hasSearched: boolean;
  setSearchQuery: (searchQuery: string) => void;
  searchUserDocuments: (userEmail: string) => Promise<void>;
  removeSearchResult: (documentId: string) => void;
  resetSearch: () => void;
};

export type UploadState = {
  uploadError: string;
  isUploading: boolean;
  uploadDocument: (userEmail: string, file: File) => Promise<void>;
  resetUpload: () => void;
};
