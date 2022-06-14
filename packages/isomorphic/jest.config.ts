import { Config } from '@jest/types';
import baseConfig from '../../jest.config.base';

const config: Config.InitialOptions = {
  ...baseConfig,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
};

export default config;
