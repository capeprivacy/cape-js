# Cape Privacy SDK for JavaScript

[![codecov](https://codecov.io/gh/capeprivacy/cape-js/branch/main/graph/badge.svg?token=faHLjMR1MK)](https://codecov.io/gh/capeprivacy/cape-js) ![build](https://github.com/capeprivacy/cape-js/actions/workflows/test.yml/badge.svg)

The Cape SDK for JavaScript is a library that provides a simple way to interact with the Cape Privacy API. Works in Node.js and the browser.

## Installation

Using npm:

```bash
npm install @cape/cape-sdk
```

Using yarn:

```bash
yarn add @cape/cape-sdk
```

## Usage

Example [index.mjs](https://github.com/capeprivacy/cape-js/tree/main/packages/cape/examples/index.mjs):

Replace `<AUTH_TOKEN>` and `<FUNCTION_ID>` with your values.

```js
import { Cape } from '@cape/cape-sdk';

const client = new Cape({ authToken: '<AUTH_TOKEN>' });
await client.run({ id: '<FUNCTION_ID>', data: 'Hello world' });
```

## TypeScript

The Cape SDK for JavaScript bundles TypeScript definitions to use in TypeScript projects.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
