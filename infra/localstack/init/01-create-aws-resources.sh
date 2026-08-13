#!/bin/sh
set -eu

BUCKET_NAME="document-search-local"
QUEUE_NAME="document-events"
REGION="us-east-1"

awslocal s3api create-bucket --bucket "$BUCKET_NAME" >/dev/null 2>&1 || true

awslocal s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["PUT","GET"],"AllowedOrigins":["http://localhost:5173"],"ExposeHeaders":[]}]}'

QUEUE_URL=$(awslocal sqs create-queue --queue-name "$QUEUE_NAME" --query QueueUrl --output text)
QUEUE_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "$QUEUE_URL" \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text)

awslocal s3api put-bucket-notification-configuration \
  --bucket "$BUCKET_NAME" \
  --notification-configuration "{\"QueueConfigurations\":[{\"QueueArn\":\"$QUEUE_ARN\",\"Events\":[\"s3:ObjectCreated:Put\"],\"Filter\":{\"Key\":{\"FilterRules\":[{\"Name\":\"prefix\",\"Value\":\"documents/\"}]}}}]}"

printf 'LocalStack resources ready: s3://%s, %s\n' "$BUCKET_NAME" "$QUEUE_URL"
