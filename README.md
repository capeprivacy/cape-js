# Cape Privacy SDK for JavaScript

## Prerequisites

1. Cape Access Token:
```
cat ~/.config/cape/auth | jq -r .access_token
```

2. Cape Function ID, from `cape deploy`.

3. Yarn
```
npm install yarn -g
```

## Build
```
yarn install && yarn build
```

## Test
```
yarn test
```

## Example

Edit `packages/cape/examples/run.mjs` to replace `<AUTH_TOKEN>` and `<FUNCTION_ID>` with your values.

Run the example:
```
node packages/cape/examples/run.mjs
```
