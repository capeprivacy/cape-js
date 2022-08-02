import { Config } from '@jest/types';
import baseConfig from '../../jest.config.base';

const config: Config.InitialOptions = {
  ...baseConfig,
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '@capeprivacy/isomorphic': '<rootDir>/../isomorphic/src/index.node.ts',
    '@capeprivacy/(.*)': '<rootDir>/../$1/src',
  },
};

export default config;
