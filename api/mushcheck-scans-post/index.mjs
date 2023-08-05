// File: api\mushcheck-scans-post\index.mjs

import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import {
  RekognitionClient,
  DetectCustomLabelsCommand,
} from "@aws-sdk/client-rekognition";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

const rekognition = new RekognitionClient();

const s3 = new S3Client();

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
 * @param {RekognitionClient} rekognition_client
 * @param {Buffer} image
 * @returns {Promise<{CustomLabels: {Name: string, Confidence: number}[]}>}
 */
async function getImageLabels(rekognition_client, image) {
  const params = {
    ProjectVersionArn: process.env["rekognitionEndpoint"],
    Image: {
      Bytes: image,
    },
    MaxLabels: 3,
  };

  return rekognition_client.send(new DetectCustomLabelsCommand(params));
}

/**
 * @param {S3Client} s3_client
 * @param {Buffer} image
 * @returns {Promise<{ETag: string, VersionId: string, Location: string, key: string, Bucket: string}>}
 */
async function uploadImageToS3(s3_client, image, key) {
  const params = {
    Bucket: process.env["bucketName"],
    Key: key,
    ContentType: "image",
    Body: image,
  };

  return s3_client.send(new PutObjectCommand(params));
}

/**
 * @param {{body: string}} event
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const handler = async (event) => {
  const connection = await db_pool.getConnection();

  try {
    const body = JSON.parse(event?.body);
    const image_base64 = body?.image?.substring(body?.image?.indexOf(",") + 1);
    const user_id = body?.user_id;

    if (!image_base64) {
      return formatResponse(400, { message: "No image provided" });
    }
    // 22,369,621 = 16 * 1024 * 1024 * (8 / 6) = 16 MB
    if (image_base64.length > 22_369_621) {
      return formatResponse(413, {
        message: "Image too large (more than 16 MB)",
      });
    }
    if (!user_id) {
      return formatResponse(400, { message: "No user ID provided" });
    }
    if (user_id.length !== 32) {
      return formatResponse(400, { message: "Invalid user ID" });
    }

    const image = Buffer.from(image_base64, "base64");
    const labels = (await getImageLabels(rekognition, image)).CustomLabels;

    if (labels.length == 0) {
      return formatResponse(200, {
        message: "Sorry, we couldn't find any mushrooms in your image.",
      });
    }

    const created_date = Date.now();
    const image_key = `scan_images/${user_id}_${created_date}`;
    const s3_response = await uploadImageToS3(s3, image, image_key);
    if (s3_response?.$metadata?.httpStatusCode !== 200) {
      return formatResponse(500, { message: "Failed to upload image" });
    }

    const image_url = image_key;

    const class1 = labels[0].Name;
    const confidence1 = labels[0].Confidence;
    const class2 = labels[1]?.Name ?? null;
    const confidence2 = labels[1]?.Confidence ?? null;
    const class3 = labels[2]?.Name ?? null;
    const confidence3 = labels[2]?.Confidence ?? null;

    const query = `INSERT INTO scans (image_url, class1, confidence1, class2, confidence2, class3, confidence3, user_id, created_date, last_visit) VALUES (?, ?, ?, ?, ?, ?, ?, UNHEX(?), ?, ?)`;
    const [result] = await connection.execute(query, [
      image_url,
      class1,
      confidence1,
      class2,
      confidence2,
      class3,
      confidence3,
      user_id,
      new Date(created_date).toISOString(),
      new Date(created_date).toISOString(),
    ]);

    return formatResponse(201, { scan_id: result.insertId });
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
