import { Cape } from '../dist/index.mjs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as pkijs from 'pkijs';
import * as crypto from 'crypto';

// Fill with your own values
const id = 'kvmSQyFfQj5jWqBF4BJTxu';
const data = '5';

const name = 'nodeEngine';
pkijs.setEngine(name, new pkijs.CryptoEngine({ name, crypto: crypto.webcrypto }));

const authToken = JSON.parse(fs.readFileSync(path.resolve(os.homedir(), '.config/cape/auth'), 'utf-8')).access_token;
const client = new Cape({ authToken, verbose: false });

//const dek = client.generateDataEncryptionKey()

console.log(await client.key('capedocs'));

const encrypted = await client.encrypt(data, { username: 'justin1121' });

const result = await client.run({ id, data: encrypted });
