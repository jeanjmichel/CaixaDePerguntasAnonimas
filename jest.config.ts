import type { Config } from 'jest';

const commonConfig = {
  preset: 'ts-jest' as const,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};

const config: Config = {
  projects: [
    {
      ...commonConfig,
      displayName: 'server',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/tests/**/*.test.ts'],
    },
    {
      ...commonConfig,
      displayName: 'components',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/tests/**/*.test.tsx'],
      moduleNameMapper: {
        ...commonConfig.moduleNameMapper,
        '\\.module\\.css$': '<rootDir>/tests/helpers/__mocks__/styleMock.ts',
      },
    },
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};

export default config;
