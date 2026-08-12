import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { SearchResult } from '../api'
import { renderHighlight } from '../utils/format'

type SearchPanelProps = {
  searchQuery: string
  searchResults: SearchResult[]
  searchError: string
  isSearching: boolean
  onSearchQueryChange: (value: string) => void
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function SearchPanel({
  searchQuery,
  searchResults,
  searchError,
  isSearching,
  onSearchQueryChange,
  onSearchSubmit,
}: SearchPanelProps) {
  return (
    <Card className="search-panel" aria-labelledby="search-title">
      <CardHeader className="p-0">
        <CardTitle id="search-title">Search indexed documents</CardTitle>
        <p>Search uses OpenSearch fuzziness and returns text highlights from matching documents.</p>
      </CardHeader>
      <CardContent className="p-0">
        <form className="search-form" onSubmit={onSearchSubmit}>
          <Input
            type="search"
            value={searchQuery}
            placeholder="Search contract terms, names, clauses..."
            onChange={(event) => onSearchQueryChange(event.target.value)}
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
