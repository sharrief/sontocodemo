/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
const { pathsToModuleNameMapper } = require('ts-jest/utils');
const tsconfig = require('../../tsconfig.json');

const { compilerOptions } = tsconfig;

module.exports = {
  preset: 'ts-jest',
  verbose: true,
  automock: false,
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../' }),
    '\\.(pem|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__tests__/__mocks__/fileMock.ts',
    '\\.(css|less|scss)$': '<rootDir>/__tests__/__mocks__/styleMock.ts',
    moduleFileExtensions: [
      'js',
      'jsx',
      'ts',
      'tsx',
      'json',
    ],
  },
  moduleDirectories: [
    'node_modules',
  ],
  snapshotSerializers: [
    'enzyme-to-json/serializer',
  ],
  roots: [
    '<rootDir>/',
  ],
  testMatch: [
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)',
  ],
  transform: {
    '^.+\\.(ts|js|jsx|tsx)$': ['ts-jest'],
  },
  testEnvironment: 'node',
  setupFiles: ['./jest.env.ts'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
};
