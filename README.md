# Cape Privacy SDK for JavaScript

[![codecov](https://codecov.io/gh/capeprivacy/cape-js/branch/main/graph/badge.svg?token=faHLjMR1MK)](https://codecov.io/gh/capeprivacy/cape-js) ![build](https://github.com/capeprivacy/cape-js/actions/workflows/test.yml/badge.svg)

The Cape SDK for JavaScript is a library that provides a simple way to interact with the Cape Privacy API. Works in Node.js and the browser.

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#typescript">TypeScript</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## Installation

Using npm:

```bash
npm install @capeprivacy/cape-sdk
```

Using yarn:

```bash
yarn add @capeprivacy/cape-sdk
```

<p align="right">(<a href="#top">back to top</a>)</p>

## Usage

Replace `<AUTH_TOKEN>` and `<FUNCTION_ID>` with your values.

### `run`

Run is used to invoke a function once with a single input.

Example [run.mjs](https://github.com/capeprivacy/cape-js/tree/main/packages/cape/examples/run.mjs):

```js
import { Cape } from '@capeprivacy/cape-sdk';

const client = new Cape({ authToken: '<AUTH_TOKEN>' });
await client.run({ id: '<FUNCTION_ID>', data: 'my-data' });
```

### `invoke`

Invoke is used to run a function repeatedly with a multiple inputs. It gives you more control over the lifecycle of
the function invocation.

Example [invoke.mjs](https://github.com/capeprivacy/cape-js/tree/main/packages/cape/examples/invoke.mjs):

```ts
const client = new Cape({ authToken: '<AUTH_TOKEN>' });

try {
  await client.connect({ id: '<FUNCTION_ID>' });

  const results = await Promise.all([
    client.invoke({ data: 'my-data-1' }),
    client.invoke({ data: 'my-data-2' }),
    client.invoke({ data: 'my-data-3' }),
  ]);
  console.log('Cape run result:', results);
} catch (err) {
  console.error('Something went wrong.', err);
} finally {
  client.disconnect();
}
```

<p align="right">(<a href="#top">back to top</a>)</p>

## TypeScript

The Cape SDK for JavaScript bundles TypeScript definitions to use in TypeScript projects.

<p align="right">(<a href="#top">back to top</a>)</p>

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

Read more about how to contribute to the Cape SDK in [CONTRIBUTING](./CONTRIBUTING.md).

<p align="right">(<a href="#top">back to top</a>)</p>

## License

[Apache 2.0](https://github.com/capeprivacy/cape-js/blob/main/LICENSE)

<p align="right">(<a href="#top">back to top</a>)</p>
