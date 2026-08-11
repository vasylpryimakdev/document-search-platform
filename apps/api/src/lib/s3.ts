import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({ region: process.env.AWS_REGION });

type CreateUploadUrlInput = {
  bucket: string;
  key: string;
  contentType: string;
};

export function createUploadUrl({ bucket, key, contentType }: CreateUploadUrlInput) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}
