// File: api\mushcheck-mushrooms-get\index.mjs

import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import { createPool } from "mysql2/promise";

/**
 * @param {Connection} connection
 * @returns {Promise<{statusCode: number, body: [{name: string, image_url: string}]}>}
 */
function getAll(connection) {
  const query = `SELECT name, image_url FROM mushrooms ORDER BY name ASC`;
  return connection.execute(query).then(([rows, fields]) => ({
    statusCode: 200,
    body: JSON.stringify(rows),
  }));
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
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Mushroom not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(rows[0]),
    };
  });
}

const kms = new KMSClient();
const params = {
  CiphertextBlob: Buffer.from(process.env["db_password"], "base64"),
  EncryptionContext: {
    LambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
  },
};
const command = new DecryptCommand(params);
const response = await kms.send(command);
const password = Buffer.from(response.Plaintext).toString("ascii");

const pool = createPool({
  host: process.env["db_host"],
  user: process.env["db_user"],
  password: password,
  port: process.env["db_port"],
  database: process.env["db_database"],
  connectionLimit: process.env["db_connectionLimit"],
});

/**
 * @param {{queryStringParameters: {name: string}}} event
 * @returns {Promise<{statusCode: number, body: any}>}
 */
export const handler = async (event) => {
  const name = event?.queryStringParameters?.name;

  const connection = await pool.getConnection();
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
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  } finally {
    connection.release();
  }
};
