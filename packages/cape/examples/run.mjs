import { Cape } from '../dist-cjs/index.js';

(async () => {
  const client = new Cape({ authToken: 'abc' });
  await client.run({ id: '8F467C2F-E507-45C5-B486-4E767C375E23' });
})();
