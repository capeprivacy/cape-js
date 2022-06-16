import { readFile } from 'fs/promises';
import { Cape } from '../dist-cjs/index.js';

const data = await readFile('./text.txt', { encoding: 'utf8' });

const client = new Cape({ authToken: '<AUTH_TOKEN>' });
const result = await client.run({ id: '<FUNCTION_ID>', data });

console.log('Cape run result:', result);
