import { resolve } from 'path';
import dotenv from 'dotenv';

const path = resolve('envs/test.local.env');
dotenv.config({ path });
// eslint-disable-next-line no-console
// console.log(`Loaded .env from ${path}`);
