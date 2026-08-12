import { create } from 'zustand'
import { searchDocuments, type SearchResult } from '../api'

type SearchState = {
  searchQuery: string
  searchResults: SearchResult[]
  searchError: string
  isSearching: boolean
  hasSearched: boolean
  setSearchQuery: (searchQuery: string) => void
  searchUserDocuments: (userEmail: string) => Promise<void>
  removeSearchResult: (documentId: string) => void
  resetSearch: () => void
}

export const useSearchStore = create<SearchState>((set, get) => ({
  searchQuery: '',
  searchResults: [],
  searchError: '',
  isSearching: false,
  hasSearched: false,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  searchUserDocuments: async (userEmail) => {
    const query = get().searchQuery.trim()

    if (!query) {
      set({ searchError: 'Enter text to search', hasSearched: false })
      return
    }

    set({ isSearching: true, searchError: '', hasSearched: true })

    try {
      const response = await searchDocuments(userEmail, query)
      set({ searchResults: response.results })
    } catch (error) {
      set({ searchError: error instanceof Error ? error.message : 'Failed to search documents' })
    } finally {
      set({ isSearching: false })
    }
  },
  removeSearchResult: (documentId) =>
    set((state) => ({
      searchResults: state.searchResults.filter((result) => result.documentId !== documentId),
    })),
  resetSearch: () =>
    set({ searchQuery: '', searchResults: [], searchError: '', isSearching: false, hasSearched: false }),
}))
