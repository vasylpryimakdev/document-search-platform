import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '../stores/auth-store'
import { useDocumentsStore } from '../stores/documents-store'
import { useSearchStore } from '../stores/search-store'
import { renderHighlight } from '../utils/format'

export function SearchPanel() {
  const userEmail = useAuthStore((state) => state.userEmail)
  const searchQuery = useSearchStore((state) => state.searchQuery)
  const searchResults = useSearchStore((state) => state.searchResults)
  const searchError = useSearchStore((state) => state.searchError)
  const isSearching = useSearchStore((state) => state.isSearching)
  const hasSearched = useSearchStore((state) => state.hasSearched)
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery)
  const searchUserDocuments = useSearchStore((state) => state.searchUserDocuments)
  const documents = useDocumentsStore((state) => state.documents)
  const pendingDocumentsCount = documents.filter((document) => document.status === 'PENDING').length
  const indexedDocumentsCount = documents.filter((document) => document.status === 'INDEXED').length
  const errorDocumentsCount = documents.filter((document) => document.status === 'ERROR').length
  const showEmptySearchResults = hasSearched && !isSearching && !searchError && searchResults.length === 0

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void searchUserDocuments(userEmail)
  }

  return (
    <Card className="search-panel" aria-labelledby="search-title">
      <CardHeader className="p-0">
        <CardTitle id="search-title">Search indexed documents</CardTitle>
        <p>Search uses OpenSearch fuzziness and returns text highlights from matching documents.</p>
      </CardHeader>
      <CardContent className="p-0">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <Input
            type="search"
            value={searchQuery}
            placeholder="Search contract terms, names, clauses..."
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </CardContent>
      {pendingDocumentsCount > 0 ? (
        <p className="search-hint">
          {pendingDocumentsCount} document{pendingDocumentsCount === 1 ? ' is' : 's are'} still indexing and
          may not appear in search yet.
        </p>
      ) : null}
      {indexedDocumentsCount === 0 && documents.length > 0 ? (
        <p className="search-hint">No indexed documents are searchable yet.</p>
      ) : null}
      {errorDocumentsCount > 0 ? (
        <p className="search-hint">
          {errorDocumentsCount} document{errorDocumentsCount === 1 ? ' failed' : 's failed'} indexing.
        </p>
      ) : null}
      {searchError ? <p className="search-error">{searchError}</p> : null}
      {showEmptySearchResults ? (
        <p className="search-empty">No indexed matches found. Try words from the document text or filename.</p>
      ) : null}
      {searchResults.length > 0 ? (
        <div className="search-results">
          {searchResults.map((result) => (
            <article className="search-result" key={result.documentId}>
              <h3>{result.userFilename}</h3>
              <div className="highlights">
                {result.highlights.map((highlight, index) => (
                  <p key={`${result.documentId}-${index}`}>{renderHighlight(highlight)}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
