import fs from 'fs';
import path from 'path';
import os from 'os';
import * as pkijs from 'pkijs';
import * as crypto from 'crypto';

import { Cape } from '../dist/index.mjs';

const name = 'nodeEngine';
pkijs.setEngine(name, new pkijs.CryptoEngine({ name, crypto: crypto.webcrypto }));

const authToken = JSON.parse(fs.readFileSync(path.resolve(os.homedir(), '.config/cape/auth'), 'utf-8')).access_token;
const client = new Cape({ authToken });

// returns your key
const key = await client.key();
console.log(key);

// returns justin1121's key
const justinKey = await client.key('justin1121');
console.log(justinKey);
