/* eslint-disable max-classes-per-file */
/* eslint-disable import/extensions */
import * as AzureApplicationInsights from 'applicationinsights';
import 'reflect-metadata';
import path from 'path';
import createError from 'http-errors';
import express, {
  Request, Response,
} from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { useExpressServer } from 'routing-controllers';
import session, { Store } from 'express-session';
import MySQLSessionStore from 'express-mysql-session';
import morgan from 'morgan';
import passport from 'passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import passportLocal from 'passport-local';
import { error, debug, info } from '@log';
import { API, endpoints } from '@api';
import {
  getPool, sessionConfig, getConnection,
} from '@lib/db';
import {
  deserializeUser, authenticateUser, authMiddleware,
} from '@middleware/auth';
import { deserializeApplication, authenticateApplicant } from '@middleware/appAuth';
import env from '@lib/env';
import {
  UsersController, AccountsController, ManagersController,
  StatementsController, TradesController, OperationsController,
  RequestsController, DocumentsController, ApplicationsController,
  BankAccountsController, TradeLogController,
} from '@controllers';
import { StatementsSockets } from '@sockets';
import { startWatchNewRequests } from '@jobs';
import { createTerminus } from '@godaddy/terminus';
import type { SessionSocket } from '@types';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { SiteMetadata } from '@interfaces';

if (env.var.APPINSIGHTS_INSTRUMENTATIONKEY) {
  AzureApplicationInsights.setup(env.var.APPINSIGHTS_INSTRUMENTATIONKEY);
  AzureApplicationInsights.start();
}

const expressApp = express();

debug('Server starting...');

expressApp.use(express.json());
if (env.isDevelopment) {
  expressApp.use(morgan('dev'));
} else {
  expressApp.use(morgan('combined'));
}

debug('Session setup...');
let pool;
try { pool = getPool(); } catch (err) { error(`Could not connect to MySQL pool for session store: ${err}`); }
const store = new MySQLSessionStore({}, pool);
const sessionMiddleware = session({ ...sessionConfig, store: store as unknown as Store });
expressApp.use(sessionMiddleware);

debug('Passport setup...');
expressApp.use(passport.initialize());
expressApp.use(passport.session());
const LocalStrategy = passportLocal.Strategy;
passport.use('accounts', new CustomStrategy(
  async (
    req,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: (err: string, ...args: any[]) => void,
  ) => authenticateUser({
    email: req.body.email,
    password: req.body.password,
    otp: req.body.otp,
  },
  done),
));
passport.use('application', new LocalStrategy(
  {
    usernameField: 'authEmail',
    passwordField: 'appPIN',
  },
  async (
    authEmail: string,
    appPIN: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: (err: string, ...args: any[]) => void,
  ) => authenticateApplicant(authEmail, appPIN, done),
));
passport.serializeUser(async ({ type, ...rest }, done) => {
  if (type === 'user' && rest.authUser) {
    const { authUser } = rest;
    done(null, { type, id: authUser.id });
  }
  if (type === 'application' && rest.application) {
    const { application: { authEmail, appPIN } } = rest;
    done(null, { type, authEmail, appPIN });
  }
});
passport.deserializeUser(async (serializedData: { type: string; id: number; authEmail: string; appPIN: string}, done) => {
  try {
    if (serializedData.type === 'user') {
      const { id } = serializedData;
      const authUser = await deserializeUser(id);
      if (!authUser) throw new Error(`Failed to deserialize user with id ${id}.`);
      return done(null, { authUser });
    }
    if (serializedData.type === 'application') {
      const { authEmail, appPIN } = serializedData;
      const app = await deserializeApplication(authEmail, appPIN);
      return done(null, { application: app });
    }
    throw new Error('Failed to deserialize as nothing was provided to deserialize.');
  } catch (err) {
    if (err) error(err);
    return done(err);
  }
});

debug('Route setup...');

// #region pages

// HTML template used for hot reloading during development
const getHtml = (scriptName: string) => (`
<html class="no-js" lang="">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie-edge">
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="viewport" content="viewport-fit=cover, user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1">
    <link rel="icon" href="/static/favicon.png">
    <link rel="apple-touch-icon" href="/static/favicon.png">
    <meta name="apple-mobile-web-app-title" content="${env.var.SITE_NAME}">
    <link rel="stylesheet" type="text/css" href="/static/${scriptName}.css">
    </head>
  <body>
    <div id="root"></div>
    <script src="/static/${scriptName}.js"></script>
  </body>
</html>`);

const watchClient = env.var.WATCH_CLIENT === 'true';
if (watchClient) {
  expressApp.use('/static', (...args) => (createProxyMiddleware({ target: 'http://localhost:3001' })(...args)));
} else {
  expressApp.use('/static', express.static(path.join(__dirname, '../../build/static')));
}

expressApp.get('/', async (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    if (req.session.prevURL) return res.redirect(303, req.session.prevURL);
    if (req.user.authUser) {
      if (watchClient) {
        const HTML = getHtml('dashboard');
        return res.send(HTML);
      }
      return res.sendFile(path.join(__dirname, '../../build/static/dashboard.html'));
    }
    if (req.user.application) {
      return res.redirect(303, endpoints.application);
    }
  }
  return res.redirect(303, API.Users.Login.Route);
});

expressApp.get(API.Users.Login.Route, async (req: Request, res: Response) => {
  if (req.isAuthenticated()) { res.redirect(303, '/'); }
  if (watchClient) {
    const HTML = getHtml('login');
    return res.send(HTML);
  }
  return res.sendFile(path.join(__dirname, '../../build/static/login.html'));
});

expressApp.post(`${API.Users.Login.Route}*`,
  (req: Request, res: Response, next: (error?: string) => void) => passport.authenticate('accounts', (err, user, authMessage) => {
    if (!user || err) {
      return res.send({
        success: false,
        message: err || authMessage.message,
        otpRequired: authMessage.otpRequired,
      });
    }
    return req.logout((err) => {
      if (err) return next(err);
      return req.session.regenerate(() => {
        const { link } = req.body;
        req.login(user, (loginError) => {
          if (loginError) return next(loginError);
          return res.send({
            success: true,
            message: authMessage?.message,
            link: (link && decodeURIComponent(link)) || '/',
          });
        });
      });
    });
  })(req, res, next));

expressApp.get(API.Metadata.Site.Route, async (_req: Request, res: Response) => {
  const siteMeta: SiteMetadata = {
    siteName: env.var.SITE_NAME,
    siteUrl: env.var.SITE_URL,
    adminEmail: env.var.EMAIL_ADMIN,
    requestsDisabled: env.var.NEW_REQUESTS_DISABLED,
  };
  return res.send(siteMeta);
});

expressApp.get(`${endpoints.passwordReset}:resetKey?`, (_req: Request, res: Response) => {
  if (watchClient) {
    const HTML = getHtml('passwordReset');
    return res.send(HTML);
  }
  return res.sendFile(path.join(__dirname, '../../build/static/passwordReset.html'));
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
expressApp.get(endpoints.logout, (req: Request, res: Response, next: (error?: any) => void) => {
  if (req.session == null) { next(createError(500)); } else {
    req.session.destroy((err) => { if (err)next(createError(500)); });
    res.redirect(303, API.Users.Login.Route);
  }
});

expressApp.get(`${endpoints.dashboard}*`, authMiddleware, (req: Request, res: Response) => {
  const prevURL = req.originalUrl;
  return res.redirect(303, `/#/?link=${encodeURIComponent(prevURL)}`);
});

expressApp.get(`${endpoints.administration}*`, authMiddleware, (req: Request, res: Response) => {
  const prevURL = req.originalUrl;
  return res.redirect(303, `/#/?link=${encodeURIComponent(prevURL)}`);
});

expressApp.get(`${endpoints.application}*`, (req: Request, res: Response) => {
  if (watchClient) {
    const HTML = getHtml('application');
    res.send(HTML);
  } else {
    res.sendFile(path.join(__dirname, '../../build/static/application.html'));
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
expressApp.get(endpoints.exitApplication, (req: Request, res: Response, next: (error?: any) => void) => {
  if (req.session == null) { next(createError(500)); } else {
    req.session.destroy((err) => { if (err)next(createError(500)); });
    res.redirect(303, `${endpoints.application}?logout=true`);
  }
});

const controllers = [
  UsersController,
  AccountsController,
  ManagersController,
  StatementsController,
  TradesController,
  TradeLogController,
  OperationsController,
  RequestsController,
  DocumentsController,
  ApplicationsController,
  BankAccountsController,
];
useExpressServer(expressApp, {
  controllers: [
    ...controllers,
    // ...headlessControllers,
  ],
});
// #endregion
debug('Starting socket.io...');
const httpServer = http.createServer(expressApp);
const io = new SocketIOServer(httpServer, { path: endpoints.socket });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type expressMiddleware = (req: any, res: any, next: (err?: any) => any) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrap = (middleware: expressMiddleware) => (socket: Socket, next: (err?: any) => any) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
io.use((socket: SessionSocket, next: (err?: any) => any) => {
  if (socket.request.session.passport.user) { next(); } else {
    error('No user found on socket');
    next(new Error('UNAUTHORIZED'));
  }
});

io.on('connection', (socket: SessionSocket) => {
  socket.on(API.Statements.Populate.Event, (args: Parameters<typeof API.Statements.Populate.emit>[0]) => {
    StatementsSockets.populate(socket, args);
  });
});

// #endregion
// catch 404 and forward to error handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
debug('Starting jobs...');
startWatchNewRequests();
debug('Starting listener...');
const port = env.var.PORT || 8080;
debug(`Will connect to DB @${env.var.DB_HOST} on port ${env.var.DB_PORT}`);
if (env.isProduction) {
  createTerminus(expressApp, {
    onSignal: async () => {
      debug('Closing database connection');
      const conn = await getConnection();
      await conn.close();
      await store.close();
      debug('Database connection closed');
      debug('Closing sockets');
      io.disconnectSockets();
      debug('Sockets closed');
    },
    onShutdown: async () => { info('Server is shutting down'); },
  });
}
export const server = httpServer.listen(port, () => info(`App listening on port ${port} in ${env.var.NODE_ENV} mode`));

export default server;
