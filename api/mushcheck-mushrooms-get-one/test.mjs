import { handler } from "./index.mjs";

console.log(await handler({ queryStringParameters: { name: "Suillus" } }));
