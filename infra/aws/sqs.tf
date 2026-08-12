resource "aws_sqs_queue" "document_events_dlq" {
  name                      = "${local.name_prefix}-document-events-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
  receive_wait_time_seconds = 20

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-document-events-dlq"
  })
}

resource "aws_sqs_queue" "document_events" {
  name                       = "${local.name_prefix}-document-events"
  visibility_timeout_seconds = 120
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 20
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.document_events_dlq.arn
    maxReceiveCount     = 5
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-document-events"
  })
}

data "aws_iam_policy_document" "sqs_allow_s3" {
  statement {
    sid    = "AllowS3SendMessage"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }

    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.document_events.arn]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_s3_bucket.documents.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }
}

resource "aws_sqs_queue_policy" "document_events" {
  queue_url = aws_sqs_queue.document_events.id
  policy    = data.aws_iam_policy_document.sqs_allow_s3.json
}
