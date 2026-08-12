import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { contentWidth, glassCard } from "../styles";
import { useAuthStore } from "../stores/auth-store";
import { useDocumentsStore } from "../stores/documents-store";
import { useSearchStore } from "../stores/search-store";
import { renderHighlight } from "../utils/format";

export function SearchPanel() {
  const userEmail = useAuthStore((state) => state.userEmail);
  const searchQuery = useSearchStore((state) => state.searchQuery);
  const searchResults = useSearchStore((state) => state.searchResults);
  const searchError = useSearchStore((state) => state.searchError);
  const isSearching = useSearchStore((state) => state.isSearching);
  const hasSearched = useSearchStore((state) => state.hasSearched);
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery);
  const searchUserDocuments = useSearchStore(
    (state) => state.searchUserDocuments,
  );
  const documents = useDocumentsStore((state) => state.documents);
  const pendingDocumentsCount = documents.filter(
    (document) => document.status === "PENDING",
  ).length;
  const indexedDocumentsCount = documents.filter(
    (document) => document.status === "INDEXED",
  ).length;
  const errorDocumentsCount = documents.filter(
    (document) => document.status === "ERROR",
  ).length;
  const showEmptySearchResults =
    hasSearched && !isSearching && !searchError && searchResults.length === 0;
  const hasIndexedDocuments = indexedDocumentsCount > 0;

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchUserDocuments(userEmail);
  }

  return (
    <Card
      className={`${contentWidth} ${glassCard} mt-5 box-border rounded-3xl p-6`}
      aria-labelledby="search-title"
    >
      <CardHeader className="p-0">
        <CardTitle className="text-2xl" id="search-title">
          Search indexed documents
        </CardTitle>
        <p className="mt-1.5 text-slate-300">
          Search uses OpenSearch fuzziness and returns text highlights from
          matching documents.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <form
          className="mt-4.5 flex gap-3 max-md:flex-col max-md:items-stretch"
          onSubmit={handleSearchSubmit}
        >
          <Input
            className="min-w-0 flex-1 border-slate-400/40 bg-slate-950/70 text-slate-50"
            type="search"
            value={searchQuery}
            placeholder="Search contract terms, names, clauses..."
            disabled={!hasIndexedDocuments}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <Button
            className="min-w-24"
            type="submit"
            disabled={isSearching || !hasIndexedDocuments}
          >
            {isSearching ? <Loader /> : "Search"}
          </Button>
        </form>
      </CardContent>
      {pendingDocumentsCount > 0 ? (
        <p className="mt-3.5 text-slate-300">
          {pendingDocumentsCount} document
          {pendingDocumentsCount === 1 ? " is" : "s are"} still indexing and may
          not appear in search yet.
        </p>
      ) : null}
      {indexedDocumentsCount === 0 && documents.length > 0 ? (
        <p className="mt-3.5 text-slate-300">
          No indexed documents are searchable yet.
        </p>
      ) : null}
      {errorDocumentsCount > 0 ? (
        <p className="mt-3.5 text-slate-300">
          {errorDocumentsCount} document
          {errorDocumentsCount === 1 ? " failed" : "s failed"} indexing.
        </p>
      ) : null}
      {searchError ? (
        <p className="mt-3.5 text-red-700">{searchError}</p>
      ) : null}
      {showEmptySearchResults ? (
        <p className="mt-3.5 box-border rounded-2xl border border-dashed border-slate-400/40 bg-slate-950/50 px-4 py-3.5 text-slate-300">
          No indexed matches found. Try words from the document text or
          filename.
        </p>
      ) : null}
      {searchResults.length > 0 ? (
        <div className="mt-4.5 grid gap-3">
          {searchResults.map((result) => (
            <article
              className={`${glassCard} rounded-[18px] p-4 shadow-none`}
              key={result.documentId}
            >
              <h3 className="mb-2.5 font-semibold">{result.userFilename}</h3>
              <div className="grid gap-2">
                {result.highlights.map((highlight, index) => (
                  <p
                    className="m-0 text-slate-300"
                    key={`${result.documentId}-${index}`}
                  >
                    {renderHighlight(highlight)}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
