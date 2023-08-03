// File: api\mushcheck-scans-post\index.mjs

import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import {
  RekognitionClient,
  DetectCustomLabelsCommand,
} from "@aws-sdk/client-rekognition";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createPool } from "mysql2/promise";

/**
 *
 * @param {number} statusCode
 * @param {any} body
 * @returns {{statusCode: number, headers: {"Content-Type": string}, body: string}}
 */
function formatResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

/**
 *
 * @param {RekognitionClient} rekognition_client
 * @param {Buffer} image
 * @returns {Promise<{CustomLabels: {Name: string, Confidence: number}[]}>}
 */
function getImageLabels(rekognition_client, image) {
  const params = {
    ProjectVersionArn: process.env["rekognitionEndpoint"],
    Image: {
      Bytes: image,
    },
    MaxLabels: 3,
  };

  const command = new DetectCustomLabelsCommand(params);
  return rekognition_client.send(command);
}

/**
 * @param {S3Client} s3_client
 * @param {Buffer} image
 * @returns {Promise<{ETag: string, VersionId: string, Location: string, key: string, Bucket: string}>}
 */
function uploadImageToS3(s3_client, image, user_id) {
  const params = {
    Bucket: process.env["bucketName"],
    Key: `${user_id}_${Date.now()}.jpg`,
    Body: image,
  };

  const command = new PutObjectCommand(params);
  return s3_client.send(command);
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

const rekognition = new RekognitionClient();

const s3 = new S3Client();

const pool = createPool({
  host: process.env["db_host"],
  user: process.env["db_user"],
  password: password,
  port: process.env["db_port"],
  database: process.env["db_database"],
  connectionLimit: process.env["db_connectionLimit"],
});

/**
 * @param {{body: string}} event
 * @returns {Promise<{statusCode: number, body: any}>}
 */
export const handler = async (event) => {
  const data = JSON.parse(event?.body);
  const { image: image_base64, user_id } = data;

  if (!image_base64) {
    return formatResponse(400, { message: "No image provided" });
  }
  // 22,369,621 = 16 * 1024 * 1024 * (8 / 6)
  if (image.length > 22_369_621) {
    return formatResponse(413, {
      message: "Image too large (more than 16 MB)",
    });
  }
  if (!user_id) {
    return formatResponse(400, { message: "No user ID provided" });
  }
  if (user_id.length !== 64) {
    return formatResponse(400, { message: "Invalid user ID" });
  }

  const connection = await pool.getConnection();
  try {
    const image = Buffer.from(image_base64, "base64");
    const labels = (await getImageLabels(rekognition, image)).CustomLabels;

    if (labels.length == 0) {
      return formatResponse(400, { message: "No mushrooms found" });
    }

    const image_url = (await uploadImageToS3(s3, image, user_id)).Location;

    const class1 = labels[0].Name ?? null;
    const confidence1 = labels[0].Confidence ?? null;
    const class2 = labels[1].Name ?? null;
    const confidence2 = labels[1].Confidence ?? null;
    const class3 = labels[2].Name ?? null;
    const confidence3 = labels[2].Confidence ?? null;

    const query = `INSERT INTO scans (image_url, class1, confidence1, class2, confidence2, class3, confidence3, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, UNHEX(?))`;
    const [rows, fields] = await connection.execute(query, [
      image_url,
      class1,
      confidence1,
      class2,
      confidence2,
      class3,
      confidence3,
      user_id,
    ]);

    return formatResponse(200, labels);
  } catch (error) {
    console.error(
      "Internal server error at mushcheck-rekognition-get-class endpoint",
      error
    );
    return formatResponse(500, { message: "Internal server error" });
  } finally {
    connection.release();
  }
};
