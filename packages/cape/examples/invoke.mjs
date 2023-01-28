import { Cape } from '../dist/index.mjs';

const client = new Cape({ authToken: '<AUTH_TOKEN>' });

try {
  await client.connect({ id: '<FUNCTION_ID>' });

  const results = await Promise.all([
    client.invoke({ data: 'my-data-1' }),
    client.invoke({ data: 'my-data-2' }),
    client.invoke({ data: 'my-data-3' }),
  ]);
  console.log('Cape run result:', results);
} catch (err) {
  console.error('Something went wrong.', err);
} finally {
  client.disconnect();
}

process.exit();
