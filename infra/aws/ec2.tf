data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "api_host" {
  count = var.create_ec2_instance ? 1 : 0

  ami                         = var.ec2_ami_id == "" ? data.aws_ami.amazon_linux_2023.id : var.ec2_ami_id
  instance_type               = var.ec2_instance_type
  subnet_id                   = var.ec2_subnet_id == "" ? null : var.ec2_subnet_id
  vpc_security_group_ids      = [aws_security_group.api.id]
  iam_instance_profile        = aws_iam_instance_profile.api_host.name
  associate_public_ip_address = true
  user_data = templatefile("${path.module}/user-data.sh.tftpl", {
    api_port = var.api_port
  })

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    encrypted             = true
    volume_type           = "gp3"
    volume_size           = 20
    delete_on_termination = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-host"
  })
}
