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
infra/
  aws/     Terraform AWS infrastructure specification
docker-compose.yml
```

## Local Services

Docker Compose runs local PostgreSQL, OpenSearch, and LocalStack for S3/SQS:

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

LocalStack S3/SQS:

```text
http://localhost:4566
```

The LocalStack init script creates:

- S3 bucket: `document-search-local`
- SQS queue: `document-events`
- S3 object-created notifications for the `documents/` prefix

## Environment Variables

Backend variables are documented in:

- `apps/api/.env.development.example` for local Docker/LocalStack
- `apps/api/.env.production.example` for AWS deployment

For local development, create `apps/api/.env.development` from `apps/api/.env.development.example`:

```env
PORT=3001
DATABASE_URL="postgresql://app:password@127.0.0.1:5433/document_search?schema=public"
OPENSEARCH_URL="http://localhost:9200"
OPENSEARCH_INDEX="documents"
CORS_ALLOWED_ORIGINS="https://your-frontend-domain.vercel.app,http://localhost:5173"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
AWS_ENDPOINT_URL="http://localhost:4566"
AWS_S3_FORCE_PATH_STYLE="true"
S3_BUCKET_NAME="document-search-local"
SQS_QUEUE_URL="http://localhost:4566/000000000000/document-events"
WORKER_ENABLED="true"
```

The backend loads `.env.development` by default. To load another file, set `APP_ENV` or `NODE_ENV`, for example `APP_ENV=production` loads `apps/api/.env.production`. Values from regular environment variables can still be used in production, so EC2 does not need committed env files.

Frontend variables are documented in:

- `apps/web/.env.development.example`
- `apps/web/.env.production.example`

Vite automatically loads `apps/web/.env.development` for `npm run dev` and `apps/web/.env.production` for `npm run build`. For local development, create `apps/web/.env.development` from `apps/web/.env.development.example`:

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

For local Docker-based testing, keep the SQS worker enabled:

```env
WORKER_ENABLED="true"
```

Then start the API:

```bash
npm run dev
```

With this local setup you can test the full flow without real AWS resources:

- upload a PDF/DOCX through the browser
- store it in LocalStack S3
- receive the S3 event through LocalStack SQS
- parse and index it into local OpenSearch
- see live status updates through SSE
- search indexed content with highlights
- download the original file through a pre-signed LocalStack S3 URL
- delete the document from PostgreSQL, OpenSearch, and LocalStack S3

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

## AWS Infrastructure

AWS resources are documented declaratively with Terraform in `infra/aws`.

OpenSearch is intentionally self-hosted as a Docker container on the EC2 API host for this test task. The application still uses the OpenSearch engine/API for indexing, fuzziness, and highlights, but avoids the cost and setup overhead of Amazon OpenSearch Service. In a production AWS deployment, `OPENSEARCH_URL` can point to Amazon OpenSearch Service without changing the application search flow.

The Terraform configuration covers:

- S3 bucket with public access blocked, server-side encryption, lifecycle cleanup, CORS, and object-created notifications for the `documents/` prefix.
- SQS queue with long polling, server-side encryption, and a dead-letter queue.
- Queue policy allowing only the S3 bucket to send events.
- IAM role/profile for the EC2 API host with least-privilege S3/SQS access and SSM access.
- API host security group exposing only HTTP `80` and HTTPS `443`.
- Optional EC2 host with IMDSv2 and encrypted gp3 root volume.

See `infra/aws/README.md` for usage.

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
```

For the deployed frontend, set `VITE_API_URL` to the Terraform `api_host_https_url` output.

## Manual AWS Setup

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
