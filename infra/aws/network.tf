data "aws_vpc" "selected" {
  default = var.vpc_id == "" ? true : null
  id      = var.vpc_id == "" ? null : var.vpc_id
}

resource "aws_security_group" "api" {
  name        = "${local.name_prefix}-api-sg"
  description = "Public HTTPS access for the document search API host"
  vpc_id      = data.aws_vpc.selected.id

  ingress {
    description = "HTTP for ACME challenge and redirect"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr_blocks
  }

  ingress {
    description = "HTTPS API"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidr_blocks
  }

  egress {
    description = "Outbound internet access"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-sg"
  })
}

resource "aws_eip" "api_host" {
  count = var.create_ec2_instance ? 1 : 0

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-host-eip"
  })
}

resource "aws_eip_association" "api_host" {
  count = var.create_ec2_instance ? 1 : 0

  allocation_id = aws_eip.api_host[0].id
  instance_id   = aws_instance.api_host[0].id
}
