import { Cape } from '@capeprivacy/cape-sdk';

// Fill with your own values.
// const authToken =
//   'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlVkb21jZkdEejZKVGNId2k5a29WZSJ9.eyJodHRwczovL2NhcGVwcml2YWN5LmNvbS9lbWFpbCI6ImVyaWNAY2FwZXByaXZhY3kuY29tIiwiaHR0cHM6Ly9jYXBlcHJpdmFjeS5jb20vdXNlcm5hbWUiOiJlcmljLWNhcGVwcml2YWN5IiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5jYXBlcHJpdmFjeS5jb20vIiwic3ViIjoiZ2l0aHVifDg2NjA4ODQ4IiwiYXVkIjpbImh0dHBzOi8vYXBwLmNhcGVwcml2YWN5LmNvbS92MS8iLCJodHRwczovL3Byb2QtY2FwZS51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjY4MDA2OTA5LCJleHAiOjE2NzA1OTg5MDksImF6cCI6Im9YSVR4cENkanZSWVNESnRhTWV5Y3Z2ZXFFOXFhZFVTIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCJ9.P7H-Jw5wqVn1i7QN9pN44kjy6WPBrYLqbTxDsfEmQc4zbNRGxSqHTT3P9goiptXrtSJDR3Wru79qknpasWao-EU4340Z5D-KIBQ0oSs1MsrOi7EovJ7zin9m_F5MF_qv-i4cpZWioGS5X1Pu1s1xUSGsfr_Meg-4wsclrZceidOD8tqm2HuPtO9616_aQ6ci3bj5hct3tGYmihnUnGVDR2JrbEgiCdChJm57zTAC9xCL24Q2N-LESQsrLRg6OW6K7JvQ3T4f64ALYBoy9SMuMxuEcR4rM3OoTYrcKHeTFjmGkDr4tgnU6NnyiRgJZi_Qs1HjoZ44zUsIQN1Uy5xryA';
const functionToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjgwMDcwOTEsImlhdCI6MTY2ODAwNzA5MSwiaXNzIjoiZ2l0aHVifDg2NjA4ODQ4Iiwic2NvcGUiOiJmdW5jdGlvbjppbnZva2UiLCJzdWIiOiJHdnhpRHdUTkgyejhYaFBtRDVmV2VwIn0.Wu9CfUB9xX921jm-F5lzXxjY_MUZPXYN2dk97odm-PEev95IBn5ji5QgjkWRjSvWygyPI4NbHDqGaTpybv8mKnzgGkCoM6-eG9j7oLM-Pccd4Xl8MvC18PO9BctBFVlR50VFS7dDN40lNB05mUiQyMd1kSr9sYEYHaQqbmIJHo8XyHxrBD7_ra4QNcVPdJDOYlEfiODVyre4osIkvnx1LzqJ62tV2g-HBmRjPiLRV4c-WZpxMGrqMSOxLn_EUBS65mWG9wtJr0PQbisiDzkbChA1rHeS-ogJuQfxs1WS9OPBuuY_y_uzvKPty32I1pTFN3lXjEqzE7ipsqi-n-vYCA';
// const id = "GvxiDwTNH2z8XhPmD5fWep";
// const data = '<DATA>';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const app = document.querySelector<HTMLDivElement>('#app')!;

const client = new Cape({ functionToken });
const one = JSON.stringify({
  latitude: '44.646461',
  longitude: '-63.593312',
});
try {
  const response = await client.encrypt(one);
  app.insertAdjacentHTML(
    'beforeend',
    `
    <pre>
      <code>${response}</code>
      <code>${client.encryptKey}</code>
    </pre>
`,
  );
} catch (e) {
  console.error('Error:', e);
  app.insertAdjacentHTML(
    'beforeend',
    `
    <h2>Error</h2>
    <pre>
      <code>${JSON.stringify(e, null, ' ')}</code>
    </pre>
`,
  );
} finally {
  client.disconnect();
}
