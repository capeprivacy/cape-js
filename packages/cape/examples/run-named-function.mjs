import { Cape } from '../dist/index.mjs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as crypto from 'crypto';
import * as pkijs from 'pkijs';

const name = 'nodeEngine';
pkijs.setEngine(name, new pkijs.CryptoEngine({ name, crypto: crypto.webcrypto }));

const id = 'capedocs/isprime';
const data = '13';

const authToken = JSON.parse(fs.readFileSync(path.resolve(os.homedir(), '.config/cape/auth'), 'utf-8')).access_token;
const client = new Cape({ authToken });
const result = await client.run({ id, data });

console.log('Cape run result:', result);

process.exit();
