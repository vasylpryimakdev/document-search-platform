resource "aws_cloudwatch_metric_alarm" "document_events_dlq_visible_messages" {
  alarm_name          = "${local.name_prefix}-document-events-dlq-visible-messages"
  alarm_description   = "Triggers when failed document indexing messages reach the dead-letter queue."
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.alarm_actions

  dimensions = {
    QueueName = aws_sqs_queue.document_events_dlq.name
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-document-events-dlq-visible-messages"
  })
}
