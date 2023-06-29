import mysql from 'mysql';
import { createConnection, Connection, ConnectionOptions } from 'typeorm';
import { SessionOptions } from 'express-session';
import env from '@lib/env';
import {
  User, BankDatum, Statement, Operation, Trade, Request, Document,
  Application,
  ContactInfo,
  Address, Session, TradeSymbol, TradeModel, Delegation, ReceivingBank,
} from '@entities';
import { error } from '@log';
import pem from '@server/lib/certs/azureMySQLServer';
import doCert from '@server/lib/certs/ca-certificate';
import { TradeEntry } from '@server/entities/TradeEntry';

interface ExpressMySqlConfig extends mysql.PoolConfig {
  clearExpired: true;
  expiration: number;
}

const sessionConfig: SessionOptions = {
  secret: env.var.COOKIE_SECRET,
  name: env.var.SESSION_NAME,
  cookie: {
    maxAge: 86400000, // 24HR
  },
  store: undefined, // gets set in server.js
  resave: false,
  saveUninitialized: false,
};
const DBConfig = {
  name: 'default',
  type: 'mysql',
  host: env.var.DB_HOST,
  port: env.var.DB_PORT || 3306,
  username: env.var.DB_USER,
  password: env.var.DB_PASSWORD,
  database: env.var.DB_NAME,
  synchronize: false,
  ssl: undefined as { ca: string},
  migrations: ['src/server/repositories/migrations/*.ts'],
  cli: { migrationsDir: 'src/server/repositories/migrations' },
  entities: [
    User,
    Delegation,
    BankDatum,
    ReceivingBank,
    Statement,
    Request,
    Document,
    Operation,
    Trade,
    Application,
    ContactInfo,
    Address,
    Session,
    TradeEntry,
    TradeSymbol,
    TradeModel,
  ],
};
if (env.isAzure) {
  DBConfig.ssl = {
    ca: pem,
  };
}
if (env.isDigitalOcean) {
  DBConfig.ssl = {
    ca: doCert,
  };
}
const DBConfigTest = {
  ...DBConfig,
  name: 'test',
  migrations: ['src/server/__tests__/repositories/migrations/*.ts'],
  cli: { migrationsDir: 'src/server/__tests__/repositories/migrations' },
};

const getPool = () => mysql.createPool({
  connectionLimit: 10,
  port: DBConfig.port,
  database: DBConfig.database,
  clearExpired: true, // For express-mysql-session, check for and clear expired cookies
  expiration: 3600000, // For express-mysql-session,
  timezone: 'utc',
  ssl: DBConfig.ssl,
  host: DBConfig.host,
  user: DBConfig.username,
  password: DBConfig.password,
} as ExpressMySqlConfig);

let connection: Connection = null;
const getConnection = async () => {
  try {
    if (!connection) { connection = await createConnection(DBConfig as ConnectionOptions); }
    return connection;
  } catch (err) {
    error(`db.ts: TYPEORM could not get the connection: ${err}`);
    return null;
  }
};

export {
  getConnection, getPool, DBConfig, DBConfigTest, sessionConfig,
};
