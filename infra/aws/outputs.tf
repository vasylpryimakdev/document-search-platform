output "s3_bucket_name" {
  description = "S3 bucket used for document uploads."
  value       = aws_s3_bucket.documents.bucket
}

output "sqs_queue_url" {
  description = "SQS queue URL consumed by the backend worker."
  value       = aws_sqs_queue.document_events.url
}

output "sqs_queue_arn" {
  description = "SQS queue ARN receiving S3 object-created events."
  value       = aws_sqs_queue.document_events.arn
}

output "sqs_dlq_url" {
  description = "Dead-letter queue URL for failed SQS messages."
  value       = aws_sqs_queue.document_events_dlq.url
}

output "api_security_group_id" {
  description = "Security group id for the API host."
  value       = aws_security_group.api.id
}

output "api_host_role_name" {
  description = "IAM role name for the EC2 API host."
  value       = aws_iam_role.api_host.name
}

output "api_host_instance_id" {
  description = "Optional EC2 API host instance id."
  value       = try(aws_instance.api_host[0].id, null)
}

output "api_host_public_ip" {
  description = "Optional EC2 API host public IP."
  value       = try(aws_eip.api_host[0].public_ip, aws_instance.api_host[0].public_ip, null)
}

output "api_host_https_url" {
  description = "HTTPS URL for the optional EC2 API host using sslip.io."
  value       = try("https://${replace(aws_eip.api_host[0].public_ip, ".", "-")}.sslip.io", null)
}
