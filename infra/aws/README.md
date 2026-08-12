# AWS Infrastructure

Terraform specification for the AWS resources used by the document search platform.

## What It Creates

- S3 bucket for document uploads.
- S3 public access block.
- S3 server-side encryption.
- S3 CORS for the frontend origins.
- S3 lifecycle rule to abort incomplete multipart uploads.
- S3 notification to SQS only for the `documents/` prefix.
- SQS queue for S3 object-created events.
- SQS dead-letter queue with redrive policy.
- SQS managed server-side encryption.
- Queue policy allowing only the S3 bucket to publish events.
- IAM role and instance profile for the EC2 API host.
- Least-privilege S3/SQS permissions for the backend worker.
- Security group exposing only HTTP `80` and HTTPS `443`.
- Elastic IP for a stable API host address.
- Optional EC2 host with IMDSv2 and encrypted gp3 root volume.
- CloudWatch alarm for messages in the SQS dead-letter queue.

## Usage

```bash
cd infra/aws
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

Set `create_ec2_instance = true` and provide `ec2_ami_id` if you want Terraform to create the API host too.

Set `alarm_actions` to SNS topic ARNs if you want notifications for failed indexing messages. By default the alarm is created without notification actions.

## Backend Environment

After apply, use outputs for `apps/api/.env`:

```env
AWS_REGION="us-east-1"
S3_BUCKET_NAME="<s3_bucket_name>"
SQS_QUEUE_URL="<sqs_queue_url>"
CORS_ALLOWED_ORIGINS="https://your-frontend-domain.vercel.app,http://localhost:5173"
```

Use the `api_host_https_url` output as the Vercel frontend API URL:

```env
VITE_API_URL="<api_host_https_url>"
```

## Deploy API

Terraform creates the AWS infrastructure and EC2 host. The API artifact is deployed separately through S3 and SSM so application releases do not require replacing infrastructure.

From the repository root, build the API:

```bash
cd apps/api
npm install
npm run build
npx prisma validate
```

Upload the API artifact to the Terraform-managed S3 bucket:

```bash
aws s3 sync dist s3://<s3_bucket_name>/deploy/api/dist/ --delete
aws s3 sync prisma s3://<s3_bucket_name>/deploy/api/prisma/ --delete
aws s3 cp package.json s3://<s3_bucket_name>/deploy/api/package.json
aws s3 cp package-lock.json s3://<s3_bucket_name>/deploy/api/package-lock.json
```

Run deployment on the EC2 host through SSM:

```bash
aws ssm send-command \
  --instance-ids <api_host_instance_id> \
  --document-name AWS-RunShellScript \
  --parameters '{"commands":[
    "sudo aws s3 sync s3://<s3_bucket_name>/deploy/api/ /opt/document-search-platform/apps/api/ --delete",
    "cd /opt/document-search-platform/apps/api && sudo npm ci --omit=dev",
    "cd /opt/document-search-platform/apps/api && sudo npx prisma generate",
    "cd /opt/document-search-platform/apps/api && sudo npx prisma migrate deploy",
    "sudo systemctl restart document-search-api"
  ]}'
```

Verify the deployment:

```bash
curl <api_host_https_url>/health
```

## Import Existing Resources

The current AWS stack is Terraform-managed. If you create resources manually in a different environment, import them before applying changes:

To bring existing resources under Terraform management, import them before applying changes:

```bash
terraform import aws_s3_bucket.documents <bucket-name>
terraform import aws_sqs_queue.document_events <queue-url>
terraform import aws_iam_role.api_host <role-name>
terraform import aws_security_group.api <security-group-id>
```

Importing every dependent resource is intentionally left explicit to avoid accidental replacement of live infrastructure.

## Optional Remote State

This test task keeps Terraform state local. For shared/team usage, create a dedicated S3 state bucket and DynamoDB lock table, then add a backend block such as:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "document-search-platform/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "your-terraform-locks-table"
    encrypt        = true
  }
}
```

Run `terraform init -migrate-state` after adding the backend.

## Test Task Trade-Offs

This infrastructure is intentionally production-like without becoming a large platform setup:

- PostgreSQL and OpenSearch run on the EC2 host with Docker to avoid RDS/OpenSearch Service costs.
- The API host uses SSM instead of SSH keys.
- The API is exposed through Nginx and Let's Encrypt on an `sslip.io` hostname instead of Route53, ACM, and an ALB.
- Terraform manages shared AWS infrastructure and the EC2 host. Application artifacts are still deployed separately through S3 and SSM to keep the flow simple.
- Terraform state is local for the test task. For a team environment, use an S3 backend with DynamoDB locking.
- Secrets are kept in EC2 environment files for the demo. For production, move them to SSM Parameter Store or Secrets Manager.
