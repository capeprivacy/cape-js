import { Cape } from '../dist/index.mjs';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Fill with your own values
const id = '<FUNCTION_ID>';
const data = '<DATA>';

const authToken = JSON.parse(fs.readFileSync(path.resolve(os.homedir(), '.config/cape/auth'), 'utf-8')).access_token;
const client = new Cape({ authToken });
const result = await client.run({ id, data });

console.log('Cape run result:', result);

process.exit();
