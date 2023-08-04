// File: api\mushcheck-mushrooms-get\index.mjs

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
    body,
  };
}

/**
 * @param {Connection} connection
 * @returns {Promise<{statusCode: number, body: any}>}
 */
function getAll(connection) {
  const query = `SELECT name, image_url FROM mushrooms ORDER BY name ASC`;
  return connection
    .execute(query)
    .then(([rows, fields]) => formatResponse(200, rows));
}

/**
 * @param {Connection} connection
 * @param {string} name
 * @returns {Promise<{statusCode: number, body: any}>}
 */
function getOne(connection, name) {
  const query = `SELECT * FROM mushrooms WHERE name = ?`;
  return connection.execute(query, [name]).then(([rows, fields]) => {
    if (rows.length === 0) {
      return formatResponse(404, { message: "Mushroom not found" });
    }

    return formatResponse(200, rows[0]);
  });
}

/**
 * @param {{queryStringParameters: {name: string}}} event
 * @returns {Promise<{statusCode: number, body: any}>}
 */
export const handler = async (event) => {
  const name = event?.queryStringParameters?.name;

  const connection = await db_pool.getConnection();
  try {
    if (!name) {
      return await getAll(connection);
    } else {
      return await getOne(connection, name);
    }
  } catch (error) {
    console.error(
      "Internal server error at mushcheck-mushrooms-get endpoint:",
      error
    );
    return formatResponse(500, { message: "Internal server error" });
  } finally {
    connection.release();
  }
};
