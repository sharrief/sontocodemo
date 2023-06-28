import { equal } from '@numbers';
import env from './lib/env';

expect.extend({
  toBeAmount(received: number, expected: number) {
    if (equal(received, expected)) {
      return {
        pass: true,
        message: () => `Expected ${expected} to not be equal to ${received} within epsilon 0.001`,
      };
    }
    return {
      pass: false,
      message: () => `Expected ${expected} to be equal to ${received} within epsilon 0.001`,
    };
  },
});
// eslint-disable-next-line no-console
if (!env.isTest) throw new Error(`Environment is not set for testing. NODE_ENV=${env.var.NODE_ENV}`);
