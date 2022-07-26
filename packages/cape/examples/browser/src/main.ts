import { Cape } from '@capeprivacy/cape-sdk';

// Fill with your own values.
const authToken = '<AUTH_TOKEN>';
const id = '<FUNCTION_ID>';
const data = '<DATA>';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const app = document.querySelector<HTMLDivElement>('#app')!;

const client = new Cape({ authToken });

try {
  await client.connect({ id });
  const response = await client.invoke({ data });
  app.insertAdjacentHTML(
    'beforeend',
    `
    <pre>
      <code>${response}</code>
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
