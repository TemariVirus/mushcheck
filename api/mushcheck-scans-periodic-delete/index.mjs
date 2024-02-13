// File: api\mushcheck-scans-periodic-delete\index.mjs

import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import { createConnection } from "mysql2/promise";

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

export const handler = async (event) => {
  const db_connection = await createConnection({
    host: process.env["db_host"],
    user: process.env["db_user"],
    password: password,
    port: process.env["db_port"],
    database: process.env["db_database"],
  });

  try {
    const query = `DELETE FROM scans WHERE NOT persistent AND last_visit < DATE_SUB(NOW(), INTERVAL 30 DAY);`;
    await db_connection.execute(query);

    return "Successfully deleted old scans";
  } catch (error) {
    console.error(
      "Internal server error at mushcheck-scans-periodic-delete endpoint:",
      error
    );
    return "Internal server error";
  } finally {
    db_connection.end();
  }
};
