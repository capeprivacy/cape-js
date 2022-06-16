import { Cape } from '../dist-cjs/index.js';

const client = new Cape({ authToken: '<AUTH_TOKEN>' });
const result = await client.run({ id: '<FUNCTION_ID>', data: 'Hello world' });

console.log('Cape run result:', result);

process.exit();
