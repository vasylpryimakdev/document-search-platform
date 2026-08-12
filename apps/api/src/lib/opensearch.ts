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

type SearchDocumentsInput = {
  userEmail: string;
  query: string;
};

type SearchHitSource = {
  documentId?: string;
  userFilename?: string;
  uploadedAt?: string;
};

type SearchHit = {
  _id: string;
  _source?: SearchHitSource;
  highlight?: {
    content?: string[];
  };
};

type SearchResponseBody = {
  hits: {
    hits: SearchHit[];
  };
};

export async function searchDocuments({ userEmail, query }: SearchDocumentsInput) {
  await ensureDocumentsIndex();

  const response = await opensearchClient.search({
    index: indexName,
    body: {
      query: {
        bool: {
          filter: [{ term: { userEmail } }],
          must: [
            {
              match: {
                content: {
                  query,
                  fuzziness: "AUTO",
                },
              },
            },
          ],
        },
      },
      highlight: {
        fields: {
          content: {},
        },
      },
    },
  });

  const body = response.body as unknown as SearchResponseBody;

  return body.hits.hits.map((hit) => ({
    documentId: hit._source?.documentId ?? hit._id,
    userFilename: hit._source?.userFilename ?? "Unknown document",
    uploadedAt: hit._source?.uploadedAt ?? null,
    highlights: hit.highlight?.content ?? [],
  }));
}

export async function deleteIndexedDocument(documentId: string) {
  await ensureDocumentsIndex();

  try {
    await opensearchClient.delete({
      index: indexName,
      id: documentId,
      refresh: true,
    });
  } catch (error) {
    if (isOpenSearchNotFoundError(error)) {
      return;
    }

    throw error;
  }
}

function isOpenSearchNotFoundError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: number }).statusCode === 404
  );
}

async function ensureDocumentsIndex() {
  const exists = await opensearchClient.indices.exists({ index: indexName });

  if (exists.body === true) {
    return;
  }

  try {
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
  } catch (error) {
    if (isOpenSearchResourceAlreadyExistsError(error)) {
      return;
    }

    throw error;
  }
}

function isOpenSearchResourceAlreadyExistsError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { body?: { error?: { type?: string } }; statusCode?: number }).statusCode === 400 &&
    (error as { body?: { error?: { type?: string } } }).body?.error?.type ===
      "resource_already_exists_exception"
  );
}
