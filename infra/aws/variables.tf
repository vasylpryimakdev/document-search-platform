variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used for resource names and tags."
  type        = string
  default     = "document-search-platform"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "demo"
}

variable "frontend_origins" {
  description = "Browser origins allowed to upload files to S3 and call the API through CORS."
  type        = list(string)
  default = [
    "http://localhost:5173",
  ]
}

variable "s3_document_prefix" {
  description = "S3 key prefix that stores uploaded user documents and emits SQS events."
  type        = string
  default     = "documents/"
}

variable "vpc_id" {
  description = "VPC id for the EC2 security group. If empty, the default VPC is used."
  type        = string
  default     = ""
}

variable "create_ec2_instance" {
  description = "Whether Terraform should create the EC2 host. Set false if EC2 is managed manually."
  type        = bool
  default     = false
}

variable "ec2_ami_id" {
  description = "AMI id for the optional EC2 host. If empty, latest Amazon Linux 2023 is used."
  type        = string
  default     = ""
}

variable "ec2_instance_type" {
  description = "Instance type for the optional EC2 host."
  type        = string
  default     = "t3.small"
}

variable "ec2_subnet_id" {
  description = "Subnet id for the optional EC2 host. If empty, AWS chooses the default subnet."
  type        = string
  default     = ""
}

variable "api_port" {
  description = "Local API port used by the Express process behind Nginx."
  type        = number
  default     = 3001
}

variable "deployment_artifact_prefix" {
  description = "Optional S3 prefix that the EC2 role may read for deployment artifacts."
  type        = string
  default     = "deploy/"
}

variable "alarm_actions" {
  description = "Optional CloudWatch alarm actions, for example SNS topic ARNs."
  type        = list(string)
  default     = []
}

variable "allowed_http_cidr_blocks" {
  description = "CIDR blocks allowed to reach HTTP/HTTPS on the API host."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Additional tags applied to all resources."
  type        = map(string)
  default     = {}
}
