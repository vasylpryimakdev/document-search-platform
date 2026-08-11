# Document Search Platform

Full-stack test task for uploading PDF/DOCX documents to AWS S3, processing S3 upload events through AWS SQS, indexing parsed document text into OpenSearch, and searching documents with highlights.

## Tech Stack

- Frontend: React, Vite, TypeScript
- Backend: Express, TypeScript
- Database: PostgreSQL, Prisma
- File storage: AWS S3
- Queue: AWS SQS
- Search: OpenSearch
- Live updates: Server-Sent Events
- Parsers: `pdf-parse`, `mammoth`

## Features

- Email auth mock stored in `localStorage`.
- Direct upload to S3 through backend-generated pre-signed URLs.
- One file per upload.
- File validation: `.pdf` and `.docx`, under 10MB.
- Document records stored in PostgreSQL with `userFilename` and `s3Filename`.
- Document statuses: `PENDING`, `INDEXED`, `ERROR`.
- SQS worker downloads uploaded files from S3, parses text, indexes to OpenSearch, and updates status.
- SSE connection per user for live document updates.
- List user documents.
- Search indexed documents with OpenSearch `fuzziness: AUTO` and highlights.
- Delete documents from PostgreSQL, OpenSearch, and S3.

## Architecture

```text
React app
  | POST /documents/upload-url
  v
Express API
  | create DB document status=PENDING
  | return S3 pre-signed URL
  v
React app uploads file directly to S3
  |
  | S3 ObjectCreated event
  v
SQS queue
  |
  | local Express worker polls SQS
  v
Worker downloads file from S3
  | parses PDF/DOCX
  | indexes text to OpenSearch
  | updates DB status=INDEXED or ERROR
  v
SSE notifies React app per user
```

## Project Structure

```text
apps/
  api/     Express API, Prisma, SQS worker
  web/     React Vite app
docker-compose.yml
```

## Local Services

Docker Compose runs local PostgreSQL and OpenSearch:

```bash
docker compose up -d
```

PostgreSQL uses host port `5433` to avoid conflicts with local PostgreSQL installations:

```text
postgresql://app:password@127.0.0.1:5433/document_search?schema=public
```

OpenSearch:

```text
http://localhost:9200
```

OpenSearch Dashboards:

```text
http://localhost:5601
```

## Environment Variables

Backend variables are documented in `apps/api/.env.example`.

Create `apps/api/.env` from `apps/api/.env.example`:

```env
PORT=3001
DATABASE_URL="postgresql://app:password@127.0.0.1:5433/document_search?schema=public"
OPENSEARCH_URL="http://localhost:9200"
OPENSEARCH_INDEX="documents"
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME=""
SQS_QUEUE_URL=""
WORKER_ENABLED="false"
```

Frontend variables are documented in `apps/web/.env.example`.

Create `apps/web/.env` from `apps/web/.env.example`:

```env
VITE_API_URL="http://localhost:3001"
```

## Backend Setup

```bash
cd apps/api
npm install
npx prisma migrate dev
npm run dev
```

API health check:

```text
http://localhost:3001/health
```

To run the SQS worker in the same local backend process, set:

```env
WORKER_ENABLED="true"
```

Then start the API again:

```bash
npm run dev
```

## Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## AWS Setup

Required AWS resources:

- S3 bucket for uploaded files.
- SQS queue for S3 ObjectCreated events.
- S3 event notification configured to send object-created events to SQS.
- IAM user/role with permissions for S3 and SQS.

Minimum backend permissions:

```text
s3:PutObject
s3:GetObject
s3:DeleteObject
sqs:ReceiveMessage
sqs:DeleteMessage
sqs:GetQueueAttributes
```

The S3 bucket must allow browser uploads through the generated pre-signed URL. Configure CORS similar to:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": []
  }
]
```

Configure S3 event notifications:

```text
Event type: s3:ObjectCreated:Put
Destination: SQS queue
```

The SQS queue policy must allow the S3 bucket to send messages to the queue.

## API Endpoints

```http
GET /health
```

```http
POST /documents/upload-url
```

```http
GET /documents?userEmail=user@example.com
```

```http
GET /documents/search?userEmail=user@example.com&q=contract
```

```http
DELETE /documents/:id?userEmail=user@example.com
```

```http
GET /events?userEmail=user@example.com
```

## Verification

Backend:

```bash
cd apps/api
npx prisma validate
npm run build
npm audit --omit=dev
```

Frontend:

```bash
cd apps/web
npm run build
npm run lint
```

## AWS Cleanup

After review, remove paid or potentially billable resources:

- Delete OpenSearch domain if created in AWS.
- Delete S3 bucket contents and the bucket.
- Delete SQS queue.
- Delete EC2 instance if used.
- Remove IAM access keys created for the demo.

Local cleanup:

```bash
docker compose down -v
```

## Production Improvements

- Replace email `localStorage` mock with AWS Cognito.
- Move local SQS worker to Lambda, ECS, or a dedicated worker process.
- Add retry and dead-letter queue handling.
- Store SSE pub/sub state in Redis if running multiple backend instances.
- Add file virus scanning before indexing.
- Add stricter content-type validation after downloading from S3.
- Use managed PostgreSQL for production deployments.
