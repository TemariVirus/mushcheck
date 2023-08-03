// File: api\mushcheck-mushrooms-get\index.mjs

import { createConnection } from "mysql2/promise";

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

/**
 * @param {{queryStringParameters: {name: string}}} event
 * @returns {Promise<{statusCode: number, body: any}>}
 */
export const handler = async (event) => {
  const connection = await createConnection({
    host: "mushcheck.cml9zrfq9rgt.us-east-1.rds.amazonaws.com",
    user: "ctec",
    password: "MySQL_8.0.33_Instance_for_CTEC_project",
    database: "mushcheck",
  });
  const name = event?.queryStringParameters?.name;

  try {
    await connection.connect();
    if (!name) {
      return await getAll(connection);
    } else {
      return await getOne(connection, name);
    }
  } catch (error) {
    console.error("Internal server error at mushroom endpoint:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  } finally {
    connection.end();
  }
};
