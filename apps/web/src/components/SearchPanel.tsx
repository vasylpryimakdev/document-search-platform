import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '../stores/auth-store'
import { useSearchStore } from '../stores/search-store'
import { renderHighlight } from '../utils/format'

export function SearchPanel() {
  const userEmail = useAuthStore((state) => state.userEmail)
  const searchQuery = useSearchStore((state) => state.searchQuery)
  const searchResults = useSearchStore((state) => state.searchResults)
  const searchError = useSearchStore((state) => state.searchError)
  const isSearching = useSearchStore((state) => state.isSearching)
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery)
  const searchUserDocuments = useSearchStore((state) => state.searchUserDocuments)

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
      {searchError ? <p className="search-error">{searchError}</p> : null}
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
