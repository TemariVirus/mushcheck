// File: api\mushroom-rekognition-get-class\index.mjs

import {
  RekognitionClient,
  DetectCustomLabelsCommand,
} from "@aws-sdk/client-rekognition";

const client = new RekognitionClient();

export const handler = async (event) => {
  const params = {
    ProjectVersionArn:
      "arn:aws:rekognition:us-east-1:941637046289:project/mushcheck/version/mushcheck.2023-08-02T16.07.03/1690963625734",
    Image: {
      Bytes: Buffer.from(event.image, "base64"),
    },
    MaxLabels: 5,
    MinConfidence: 70,
  };
  console.log(params);

  const command = new DetectCustomLabelsCommand(params);

  try {
    const response = await client.send(command);
    return response.CustomLabels;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
