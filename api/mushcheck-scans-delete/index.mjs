// File: api\mushcheck-scans-delete\index.mjs

import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
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

function formatResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "DELETE",
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  const scan_id = event?.queryStringParameters?.id;
  const token = event?.headers?.Authorization?.toLowerCase();
  if (!token?.startsWith("bearer ")) {
    return formatResponse(400, { message: "Invalid user ID" });
  }
  const user_id = token?.substring(7);

  if (!scan_id || !user_id) {
    return formatResponse(400, { message: "Missing scan ID or user ID" });
  }

  const connection = await db_pool.getConnection();
  try {
    const query = `DELETE FROM scans WHERE id = ? AND user_id = UNHEX(?)`;

    return await connection
      .execute(query, [scan_id, user_id])
      .then(async ([rows]) => {
        if (rows.affectedRows === 0) {
          return formatResponse(403, {
            message: "You do not have permission to delete this scan.",
          });
        }
        return formatResponse(200, { message: "Scan deleted" });
      });
  } catch (error) {
    console.error(
      "Internal server error at mushcheck-scans-delete endpoint:",
      error
    );
    return formatResponse(500, { message: "Internal server error" });
  } finally {
    connection.release();
  }
};
