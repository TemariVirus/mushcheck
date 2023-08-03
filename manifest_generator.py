import os
from datetime import datetime, timezone

BASE_FOLDER = "mushroom 9/"
BUCKET_NAME = "s3://custom-labels-console-us-east-1-7630a04773/mushroom 9/"

lines = []
for i, label in enumerate(os.listdir(BASE_FOLDER)):
    print(f"Scanning folder: {label}")

    for file in os.listdir(BASE_FOLDER + label):
        now = datetime.now(timezone.utc)
        json = (
            {
                "source-ref": f"{BUCKET_NAME}{label}/{file}",
                label: str(i),
                f"{label}-metadata": {
                    "confidence": 1,
                    "class-name": str(i),
                    "human-annotated": "yes",
                    "creation-date": f"{now.date()}T{now.time()}",
                    "type": "groundtruth/image-classification",
                },
            }
            .__str__()
            .replace("'", '"')
        )
        lines.append(json)

        print(f"Added file: {label}/{file}")

with open("annotations.manifest", "w") as f:
    f.write("\n".join(lines))
