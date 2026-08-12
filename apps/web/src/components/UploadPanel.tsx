import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { contentWidth, glassCard } from "../styles";
import { useAuthStore } from "../stores/auth-store";
import { useUploadStore } from "../stores/upload-store";

export function UploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userEmail = useAuthStore((state) => state.userEmail);
  const isUploading = useUploadStore((state) => state.isUploading);
  const uploadDocument = useUploadStore((state) => state.uploadDocument);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await uploadDocument(userEmail, file);
  }

  return (
    <Card
      className={`${contentWidth} ${glassCard} mt-6 box-border flex items-center justify-between gap-5 rounded-3xl p-7 max-md:flex-col max-md:items-stretch`}
      aria-labelledby="documents-title"
    >
      <div>
        <h2 className="mb-2 text-[28px] font-semibold" id="documents-title">
          Your documents
        </h2>
        <p className="m-0 text-slate-300">
          Upload one PDF or DOCX file under 10MB. New uploads appear as pending.
        </p>
      </div>
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
      />
      <Button
        className="min-w-24"
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? <Loader /> : "Upload"}
      </Button>
    </Card>
  );
}
