// File: api\mushroom-rekognition-get-class\index.mjs

import {
  RekognitionClient,
  DetectCustomLabelsCommand,
} from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient();

/**
 * @param {{body: string}} event
 * @returns {Promise<{statusCode: number, body: any}>}
 */
export const handler = async (event) => {
  const image = JSON.parse(event?.body)?.image;

  if (!image) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "No image provided." }),
    };
  }

  const params = {
    ProjectVersionArn: process.env["rekognitionEndpoint"],
    Image: {
      Bytes: Buffer.from(image, "base64"),
    },
    MaxLabels: 3,
    MinConfidence: 70,
  };

  const command = new DetectCustomLabelsCommand(params);

  try {
    const response = await rekognition.send(command);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response.CustomLabels),
    };
  } catch (error) {
    console.error(
      "Internal server error at mushcheck-rekognition-get-class endpoint",
      error
    );
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
