import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { contentWidth, glassCard } from "../styles";
import { useAuthStore } from "../stores/auth-store";
import { useDocumentsStore } from "../stores/documents-store";
import { useSearchStore } from "../stores/search-store";

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
          className="mt-4.5 grid grid-cols-[1fr_auto_auto] items-start gap-3 max-md:grid-cols-1 max-md:items-stretch"
          onSubmit={handleSearchSubmit}
        >
          <div>
            <Input
              className="min-w-0 border-slate-400/40 bg-slate-950/70 text-slate-50"
              type="search"
              value={searchQuery}
              placeholder="Search contract terms, names, clauses..."
              disabled={!hasIndexedDocuments}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <p className="mt-2 text-sm text-slate-400">
              Press Enter to search indexed documents.
            </p>
          </div>
          <Button
            className="min-w-24"
            type="submit"
            disabled={isSearching || !hasIndexedDocuments}
          >
            {isSearching ? <Loader /> : "Search"}
          </Button>
          <div className="rounded-2xl border border-slate-400/20 bg-slate-900/70 px-5 py-3 text-center shadow-inner max-md:text-left">
            <p className="m-0 text-xs text-slate-400">Showing</p>
            <p className="m-0 text-2xl font-bold text-sky-300">{documents.length}</p>
            <p className="m-0 text-xs text-slate-400">
              document{documents.length === 1 ? "" : "s"}
            </p>
          </div>
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
    </Card>
  );
}
