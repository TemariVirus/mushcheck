// File: api\mushcheck-scans-get\index.mjs

import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPool } from "mysql2/promise";

// Container setup
const kms = new KMSClient();
const params = {
  CiphertextBlob: Buffer.from(process.env["db_password"], "base64"),
  EncryptionContext: {
    LambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
  },
};
const kms_response = await kms.send(new DecryptCommand(params));
const password = Buffer.from(kms_response.Plaintext).toString("ascii");

const db_pool = createPool({
  host: process.env["db_host"],
  user: process.env["db_user"],
  password: password,
  port: process.env["db_port"],
  database: process.env["db_database"],
  connectionLimit: process.env["db_connectionLimit"],
});

const s3 = new S3Client();

function formatResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
    body: JSON.stringify(body),
  };
}

async function updateLastVisit(connection, id) {
  const query = `UPDATE scans SET last_visit = NOW() WHERE id = ?`;
  return connection.execute(query, [id]);
}

async function getById(connection, id, user_id, s3_client) {
  const query = `SELECT * FROM scans WHERE id = ?`;
  return connection.execute(query, [id]).then(async ([rows]) => {
    if (rows.length === 0) {
      return formatResponse(404, { message: "Scan not found" });
    }

    const scan = rows[0];
    scan.user_id = scan.user_id.toString("hex").toLowerCase();
    if (!scan.public && scan.user_id !== user_id) {
      return formatResponse(403, { message: "This scan is private" });
    }

    await updateLastVisit(connection, id);

    const params = {
      Bucket: process.env["bucketName"],
      Key: scan.image_url,
    };
    const command = new GetObjectCommand(params);
    const image_url = await getSignedUrl(s3, command, { expiresIn: 20 });

    return formatResponse(200, {
      ...scan,
      image_url,
      is_owner: scan.user_id === user_id,
      user_id: undefined,
    });
  });
}

async function getByUserId(connection, user_id) {
  if (user_id.length !== 32) {
    return Promise.resolve(formatResponse(400, { message: "Invalid user ID" }));
  }

  // No need to check if rows.length === 0 because user can have 0 scans.
  const query = `SELECT id, class1, confidence1, created_date FROM scans WHERE user_id = UNHEX(?) ORDER BY created_date DESC`;
  return connection.execute(query, [user_id]).then(([rows]) => {
    return formatResponse(200, rows);
  });
}

export const handler = async (event) => {
  const scan_id = event?.queryStringParameters?.id;
  const token = event?.headers?.Authorization?.toLowerCase();
  if (!token?.startsWith("bearer ")) {
    return formatResponse(400, { message: "Invalid user ID" });
  }
  const user_id = token?.substring(7);

  const connection = await db_pool.getConnection();
  try {
    if (scan_id) {
      return await getById(connection, scan_id, user_id, s3);
    } else if (user_id) {
      return await getByUserId(connection, user_id);
    } else {
      return formatResponse(400, { message: "Missing scan ID or user ID" });
    }
  } catch (error) {
    console.error(
      "Internal server error at mushcheck-scans-get endpoint:",
      error
    );
    return formatResponse(500, { message: "Internal server error" });
  } finally {
    connection.release();
  }
};
