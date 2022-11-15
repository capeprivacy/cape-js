import { Cape } from '../dist/index.mjs';
import fs from 'fs';
import path from 'path';
import os from 'os';

import * as pkijs from 'pkijs';
import * as crypto from 'crypto';

const name = 'nodeEngine';
pkijs.setEngine(name, new pkijs.CryptoEngine({ name, crypto: crypto.webcrypto }));

// Fill with your own values
const id = 'GvxiDwTNH2z8XhPmD5fWep';
const one = JSON.stringify({
  latitude: '44.646461',
  longitude: '-63.593312',
});

const two = JSON.stringify({
  latitude: '43.6532',
  longitude: '79.3832',
});

const functionToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjgwMDcwOTEsImlhdCI6MTY2ODAwNzA5MSwiaXNzIjoiZ2l0aHVifDg2NjA4ODQ4Iiwic2NvcGUiOiJmdW5jdGlvbjppbnZva2UiLCJzdWIiOiJHdnhpRHdUTkgyejhYaFBtRDVmV2VwIn0.Wu9CfUB9xX921jm-F5lzXxjY_MUZPXYN2dk97odm-PEev95IBn5ji5QgjkWRjSvWygyPI4NbHDqGaTpybv8mKnzgGkCoM6-eG9j7oLM-Pccd4Xl8MvC18PO9BctBFVlR50VFS7dDN40lNB05mUiQyMd1kSr9sYEYHaQqbmIJHo8XyHxrBD7_ra4QNcVPdJDOYlEfiODVyre4osIkvnx1LzqJ62tV2g-HBmRjPiLRV4c-WZpxMGrqMSOxLn_EUBS65mWG9wtJr0PQbisiDzkbChA1rHeS-ogJuQfxs1WS9OPBuuY_y_uzvKPty32I1pTFN3lXjEqzE7ipsqi-n-vYCA';

const client = new Cape({ functionToken, verbose: true });

const encrypted = await client.encrypt(one);
console.log('encrypted', encrypted);
console.log('key', client.getEncryptKey());
await client.connect({ id });

var result = await client.invoke({ data: encrypted });
result = await client.invoke({ data: two });

// const result = await client.run( {id: id, data: data});
console.log('Cape invoke result:', result);
await client.disconnect();

process.exit();
