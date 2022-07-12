import * as fs from 'fs';
import * as os from 'os';
import path from 'path';
import { Cape } from '../dist-cjs/index.js';
import { readFile } from 'fs/promises';

// Fill with your own values
const id = '<FUNCTION_ID>';

const authToken = JSON.parse(fs.readFileSync(path.resolve(os.homedir(), '.config/cape/auth'), 'utf-8')).access_token;
const data = await readFile('./text.txt', { encoding: 'utf8' });

const client = new Cape({ authToken });
const result = await client.run({ id, data });

console.log('Cape run result:', result);

process.exit();
