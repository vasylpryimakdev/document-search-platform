data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "api_host" {
  name               = "${local.name_prefix}-api-host-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-host-role"
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.api_host.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "api_host" {
  statement {
    sid    = "ManageDocumentObjects"
    effect = "Allow"

    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
    ]

    resources = ["${aws_s3_bucket.documents.arn}/${var.s3_document_prefix}*"]
  }

  statement {
    sid    = "ReadDeploymentArtifacts"
    effect = "Allow"

    actions = ["s3:GetObject"]

    resources = ["${aws_s3_bucket.documents.arn}/${var.deployment_artifact_prefix}*"]
  }

  statement {
    sid    = "ListDeploymentArtifacts"
    effect = "Allow"

    actions = ["s3:ListBucket"]

    resources = [aws_s3_bucket.documents.arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = [var.deployment_artifact_prefix, "${var.deployment_artifact_prefix}*"]
    }
  }

  statement {
    sid    = "ConsumeDocumentEvents"
    effect = "Allow"

    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
    ]

    resources = [aws_sqs_queue.document_events.arn]
  }
}

resource "aws_iam_role_policy" "api_host" {
  name   = "${local.name_prefix}-api-host-policy"
  role   = aws_iam_role.api_host.id
  policy = data.aws_iam_policy_document.api_host.json
}

resource "aws_iam_instance_profile" "api_host" {
  name = "${local.name_prefix}-api-host-profile"
  role = aws_iam_role.api_host.name
}
