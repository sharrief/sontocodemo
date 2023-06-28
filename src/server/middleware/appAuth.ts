import { RequestHandler, Request, Response } from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';
import { error as serverError, info } from '@log';
import { API } from '@api';
import { Applications } from '@repositories';
import { getConnection } from '@lib/db';
import { loginLabels } from '@serverLabels';
import passport from 'passport';
import { PromiseValue } from 'type-fest/source/promise-value';
import { Application } from '@entities';

async function checkApplicantAuthEmailAndAppPIN(authEmail: string, appPIN: string) {
  try {
    const connection = await getConnection();
    const appRepo = connection.getCustomRepository(Applications);
    const application = await appRepo.findOneOrNull({ authEmail, appPIN });
    return { application };
  } catch (error) {
    return { error };
  }
}

export async function authenticateApplicant(
  authEmail: string,
  appPIN: string,
  done: (err: string, user?: {type: string; application: Application}|boolean, authMessage?: {message: string}) => void,
) {
  try {
    info(`Authenticating applicant ${authEmail}`);
    const { error, application } = await checkApplicantAuthEmailAndAppPIN(authEmail, appPIN);
    if (error) return done(error);
    if (application) {
      return done(null, { type: 'application', application }, { message: loginLabels.applicantAuthSuccess });
    }
    return done(null, false, { message: loginLabels.applicantAuthFail });
  } catch ({ message }) {
    serverError(message);
    return done(loginLabels.serverError);
  }
}

export function LoginApplicant(req: Request, res: Response, next: (error?: string) => void) {
  passport.authenticate('application', (err, app, { message }) => {
    if (err) { return next(err); }
    if (!app) {
      const response: PromiseValue<ReturnType<typeof API.Applications.Load.post>> = {
        error: message,
      };
      return res.send(response);
    }
    // req.logout();
    return req.session.regenerate(() => req.login(app, (loginError) => {
      if (loginError) return next(loginError);
      return next();
    }));
  })(req, res, next);
}

export async function deserializeApplication(authEmail: string, appPIN: string) {
  if (!authEmail || !appPIN) { return null; }
  const connection = await getConnection();
  const appRepo = connection.getCustomRepository(Applications);
  const app = await appRepo.findOneOrNull({ authEmail, appPIN });
  return app;
}

export class AuthenticateApplicant implements ExpressMiddlewareInterface {
  // eslint-disable-next-line class-methods-use-this
  use(
    req: Parameters<RequestHandler>[0],
    res: Parameters<RequestHandler>[1],
    next: Parameters<RequestHandler>[2],
  ) {
    try {
      if (req.isAuthenticated() && req.user.application) {
        return next();
      }
      return res.send({ noSession: true });
    } catch (error) {
      error(`Applicant auth middleware threw an error: ${error}`);
      return res.send({ noSession: true });
    }
  }
}
