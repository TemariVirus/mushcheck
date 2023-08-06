// File: api\mushcheck-scans-patch\index.mjs

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

/**
 * @param {number} statusCode
 * @param {any} body
 * @returns {{statusCode: number, headers: {"Content-Type": string}, body: string}}
 */
function formatResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

/**
 * @param {{queryStringParameters: {id: number, user_id: string}}} event
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const handler = async (event) => {
  const scan_id = event?.queryStringParameters?.id;
  const user_id = event?.queryStringParameters?.user_id;
  const is_public = event?.body?.public;
  const persistent = event?.body?.persistent;

  if (!scan_id || !user_id) {
    return formatResponse(400, { message: "Missing scan ID or user ID" });
  }
  if (!is_public && !persistent) {
    return formatResponse(200, { message: "No scans updated" });
  }

  const connection = await db_pool.getConnection();
  try {
    const values = [
      ["public", is_public],
      ["persistent", persistent],
    ].filter(([_, value]) => value !== undefined);
    const query = `UPDATE scans SET ${values
      .map(([key]) => `${key} = ?`)
      .join(",")} WHERE id = ? AND user_id = UNHEX(?)`;

    return await connection
      .execute(query, [...values.map(([_, value]) => value), scan_id, user_id])
      .then(async ([rows]) => {
        if (rows.affectedRows === 0) {
          return formatResponse(403, {
            message: "You do not have permission to edit this scan.",
          });
        }
        return formatResponse(200, { message: "Scan updated" });
      });
  } catch (error) {
    console.error(
      "Internal server error at mushcheck-scans-patch endpoint:",
      error
    );
    return formatResponse(500, { message: "Internal server error" });
  } finally {
    connection.release();
  }
};
