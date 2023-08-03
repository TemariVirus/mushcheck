// File: api\mushcheck-scans-get\index.mjs

import { createConnection } from "mysql2/promise";

function updateLastVisit(connection, id) {
  const query = `UPDATE scans SET last_visit = NOW() WHERE id = ?`;
  return connection.execute(query, [id]);
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
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Scan not found" }),
      };
    }

    const scan = rows[0];
    scan.user_id = scan.user_id.toString("hex");
    if (!scan.public && scan.user_id !== user_id) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "This scan is private" }),
      };
    }

    updateLastVisit(connection, id);
    return {
      statusCode: 200,
      body: JSON.stringify({ ...rows[0], user_id: undefined }),
    };
  });
}

/**
 * @param {Connection} connection
 * @param {string} name
 * @returns {Promise<{statusCode: number, body: any}>}
 */
function getByUserId(connection, user_id) {
  if (user_id.length !== 64) {
    return Promise.resolve({
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid user ID" }),
    });
  }

  // No need to check if rows.length === 0 because user can have 0 scans.
  const query = `SELECT * FROM scans WHERE user_id = UNHEX(?)`;
  return connection.execute(query, [user_id]).then(([rows, fields]) => {
    return {
      statusCode: 200,
      body: JSON.stringify({ ...rows[0], user_id: undefined }),
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

  try {
    await connection.connect();

    const scan_id = event?.queryStringParameters?.id;
    const user_id = event?.queryStringParameters?.user_id;

    if (scan_id) {
      return await getById(connection, scan_id, user_id);
    } else if (user_id) {
      return await getByUserId(connection, user_id);
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing scan ID or user ID" }),
      };
    }
  } catch (error) {
    console.error(
      "Internal server error at mushcheck-scans-get endpoint:",
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  } finally {
    connection.end();
  }
};
