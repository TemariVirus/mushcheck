import { handler } from "./index.mjs";

console.log(
  await handler({
    queryStringParameters: {
      user_id:
        "3132333435363738393031323334353637383930313233343536373839303132",
    },
  })
);

console.log(
  await handler({
    queryStringParameters: {
      id: 2,
    },
  })
);

console.log(
  await handler({
    queryStringParameters: {
      id: 2,
      user_id:
        "3132333435363738393031323334353637383930313233343536373839303132",
    },
  })
);

console.log(
  await handler({
    queryStringParameters: {},
  })
);
