import { Button } from "@/components/ui/button";
import { contentWidth, displayTitle, eyebrow } from "../styles";
import { useAuthStore } from "../stores/auth-store";
import { useDocumentsStore } from "../stores/documents-store";
import { useSearchStore } from "../stores/search-store";
import { useUploadStore } from "../stores/upload-store";

export function DocumentsHeader() {
  const userEmail = useAuthStore((state) => state.userEmail);
  const signOut = useAuthStore((state) => state.signOut);
  const resetDocuments = useDocumentsStore((state) => state.resetDocuments);
  const resetSearch = useSearchStore((state) => state.resetSearch);
  const resetUpload = useUploadStore((state) => state.resetUpload);

  function handleSignOut() {
    signOut();
    resetUpload();
    resetSearch();
    resetDocuments();
  }

  return (
    <header
      className={`${contentWidth} flex items-start justify-between gap-6 py-7 max-md:flex-col max-md:items-stretch`}
    >
      <div>
        <p className={eyebrow}>Signed in as</p>
        <h1
          className={`${displayTitle} overflow-wrap-anywhere wrap-break-word`}
        >
          {userEmail}
        </h1>
      </div>
      <Button variant="secondary" type="button" onClick={handleSignOut}>
        Change email
      </Button>
    </header>
  );
}
