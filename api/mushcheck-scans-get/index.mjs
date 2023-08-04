// File: api\mushcheck-scans-get\index.mjs

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
 * @returns {{statusCode: number, headers: {"Content-Type": string}, body: any}}
 */
function formatResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

/**
 * @param {Connection} connection
 * @param {number} id
 */
function updateLastVisit(connection, id) {
  const query = `UPDATE scans SET last_visit = NOW() WHERE id = ?`;
  connection.execute(query, [id]);
}

/**
 * @param {Connection} connection
 * @param {number} id
 * @returns {Promise<{statusCode: number, body: any}>}
 */
function getById(connection, id, user_id) {
  const query = `SELECT * FROM scans WHERE id = ?`;
  return connection.execute(query, [id]).then(([rows, fields]) => {
    if (rows.length === 0) {
      return formatResponse(404, { message: "Scan not found" });
    }

    const scan = rows[0];
    scan.user_id = scan.user_id.toString("hex");
    if (!scan.public && scan.user_id !== user_id) {
      return formatResponse(403, { message: "This scan is private" });
    }

    updateLastVisit(connection, id);
    return formatResponse(200, { ...scan, user_id: undefined });
  });
}

/**
 * @param {Connection} connection
 * @param {string} name
 * @returns {Promise<{statusCode: number, body: any}>}
 */
function getByUserId(connection, user_id) {
  if (user_id.length !== 64) {
    return Promise.resolve(formatResponse(400, { message: "Invalid user ID" }));
  }

  // No need to check if rows.length === 0 because user can have 0 scans.
  const query = `SELECT * FROM scans WHERE user_id = UNHEX(?)`;
  return connection.execute(query, [user_id]).then(([rows, fields]) => {
    return formatResponse(
      200,
      rows.map((row) => ({ ...row, user_id: undefined }))
    );
  });
}

/**
 * @param {{queryStringParameters: {id: number, user_id: string}}} event
 * @returns {Promise<{statusCode: number, body: any}>}
 */
export const handler = async (event) => {
  const scan_id = event?.queryStringParameters?.id;
  const user_id = event?.queryStringParameters?.user_id;

  const connection = await db_pool.getConnection();
  try {
    if (scan_id) {
      return await getById(connection, scan_id, user_id);
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
