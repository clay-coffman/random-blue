import { AwsClient } from "aws4fetch";
import { env } from "./cf";

const R2_CREDS_MISSING_MSG =
  "R2 S3 credentials missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.";

export function hasR2Credentials(): boolean {
  return Boolean(
    env().R2_ACCOUNT_ID &&
      env().R2_ACCESS_KEY_ID &&
      env().R2_SECRET_ACCESS_KEY,
  );
}

// 60-second presigned GET for a key in the OWNERSHIP_DOCS bucket.
// Sensitive documents — keep expiry tight.
export async function presignOwnershipDocGet(
  r2Key: string,
  expiresInSeconds = 60,
): Promise<string> {
  const accountId = env().R2_ACCOUNT_ID;
  const accessKey = env().R2_ACCESS_KEY_ID;
  const secret = env().R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKey || !secret) {
    throw new Error(R2_CREDS_MISSING_MSG);
  }
  const client = new AwsClient({
    accessKeyId: accessKey,
    secretAccessKey: secret,
    service: "s3",
    region: "auto",
  });
  const url = new URL(
    `https://${accountId}.r2.cloudflarestorage.com/atlas-ownership-docs/${encodeURIComponent(
      r2Key,
    ).replace(/%2F/g, "/")}`,
  );
  url.searchParams.set("X-Amz-Expires", String(expiresInSeconds));
  const signed = await client.sign(
    new Request(url, { method: "GET" }),
    { aws: { signQuery: true } },
  );
  return signed.url;
}
