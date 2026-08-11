import { Client } from "@opensearch-project/opensearch";

const opensearchUrl = process.env.OPENSEARCH_URL ?? "http://localhost:9200";
const indexName = process.env.OPENSEARCH_INDEX ?? "documents";

export const opensearchClient = new Client({ node: opensearchUrl });

type IndexDocumentInput = {
  documentId: string;
  userEmail: string;
  userFilename: string;
  content: string;
  uploadedAt: Date;
};

export async function indexDocument(input: IndexDocumentInput) {
  await ensureDocumentsIndex();

  await opensearchClient.index({
    index: indexName,
    id: input.documentId,
    body: {
      documentId: input.documentId,
      userEmail: input.userEmail,
      userFilename: input.userFilename,
      content: input.content,
      uploadedAt: input.uploadedAt.toISOString(),
    },
    refresh: true,
  });
}

async function ensureDocumentsIndex() {
  const exists = await opensearchClient.indices.exists({ index: indexName });

  if (exists.body === true) {
    return;
  }

  await opensearchClient.indices.create({
    index: indexName,
    body: {
      mappings: {
        properties: {
          documentId: { type: "keyword" },
          userEmail: { type: "keyword" },
          userFilename: { type: "text", fields: { keyword: { type: "keyword" } } },
          content: { type: "text" },
          uploadedAt: { type: "date" },
        },
      },
    },
  });
}
