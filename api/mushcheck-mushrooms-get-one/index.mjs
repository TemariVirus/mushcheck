// File: api\mushcheck-mushrooms-get\index.mjs

import { createConnection } from "mysql2/promise";

async function getAllMushrooms(connection) {
  const query = `SELECT name, image_url FROM mushrooms ORDER BY name ASC`;
  const [rows] = await connection.execute(query);
  return {
    statusCode: 200,
    body: JSON.stringify(rows),
  };
}

export const handler = async (event) => {
  const connection = await createConnection({
    host: "mushcheck.cml9zrfq9rgt.us-east-1.rds.amazonaws.com",
    user: "ctec",
    password: "MySQL_8.0.33_Instance_for_CTEC_project",
    database: "mushcheck",
  });

  try {
    await connection.connect();

    if (!event?.queryStringParameters?.name) {
      return getAllMushrooms(connection);
    }

    const name = event.queryStringParameters.name;
    const query = `SELECT * FROM mushrooms WHERE name = ?`;
    const [rows] = await connection.execute(query, [name]);

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
