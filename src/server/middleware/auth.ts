import crypto from 'crypto';
import { RequestHandler } from 'express';
import { ExpressMiddlewareInterface } from 'routing-controllers';
import { authenticator } from 'otplib';
import { error as serverError, info, security } from '@log';
import { API, endpoints } from '@api';
import { Users } from '@repositories';
import { getConnection } from '@lib/db';
import { loginLabels } from '@serverLabels';
import { User } from '@entities';
import env from '@lib/env';

function validateEmail(email: string) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
async function checkUserEmailAndPass(email: string, password: string) {
  try {
    const connection = await getConnection();
    if (!connection) throw new Error(`Unable to establish the connection to the database while authenticating ${email}.`);
    const usersRepo = connection.getCustomRepository(Users);

    let salt = env.var.DB_PASSWORD_SALT;
    const { otpRequired, error } = await usersRepo.userOTPEnabled(email);
    if (error) throw new Error(error);
    if (otpRequired) salt = env.var.DB_PASSWORD_2FA_SALT;

    const hashedPassword = crypto.createHash('sha256')
      .update(password + salt, 'utf8').digest('hex');

    const user = await usersRepo.findByEmailAndHashedPassword(email, hashedPassword);

    return { user, otpRequired };
  } catch (error) {
    return { error };
  }
}
async function updateUserLastAccess(id: number) {
  const connection = await getConnection();
  const usersRepo = connection.getCustomRepository(Users);
  const user = await usersRepo.getUserById({ authUserId: id, id });
  if (user == null) throw new Error(`Failed to update last access for user ${id}`);
  await usersRepo.updateLastAccess(user);
  return { success: true };
}

export async function authenticateUser(
  credentials: {
    email: string
    password: string
    otp?: string
  },
  done: (err: string, user?: {type: string; authUser: User}|boolean, authMessage?: {message: string, otpRequired?: boolean }) => void,
) {
  try {
    const { email, password, otp } = credentials;
    security(`Authenticating ${email}`);
    if (!validateEmail(email)) { return done('', false, { message: loginLabels.notValidEmail }); }
    const { error, user } = await checkUserEmailAndPass(email, password);
    if (error) throw new Error(error);
    if (user) {
      const { otpRequired } = user;
      if (otpRequired) {
        if (!otp) return done('', false, { message: loginLabels.otpRequired, otpRequired });
        const otpValid = authenticator.verify({
          token: otp, secret: user.otpSecret1,
        });
        if (!otpValid) return done('', false, { message: loginLabels.authFail });
        delete user.otpSecret1;
      }
      // Update the user last access date/time
      await updateUserLastAccess(user.id);
      return done('', { type: 'user', authUser: user }, { message: loginLabels.authSuccess });
    }
    return done('', false, { message: loginLabels.authFail });
  } catch (e) {
    const { message } = e;
    serverError(message);
    return done('', false, { message: loginLabels.serverError });
  }
}
export async function deserializeUser(id: User['id']) {
  if (!id) { return null; }
  const connection = await getConnection();
  const usersRepo = connection.getCustomRepository(Users);
  const [user] = await usersRepo.accounts({ authUserId: id, accounts: { ids: [id] } });
  return user;
}
export const authMiddleware: RequestHandler = async function authMiddleware(req, res, next) {
  if (req.isAuthenticated() && req.user.authUser) { return next(); }
  const prevURL = req.originalUrl;
  return res.redirect(303, `${API.Users.Login.Route}?link=${encodeURIComponent(prevURL)}`);
};

export class AuthMiddleware implements ExpressMiddlewareInterface {
  // eslint-disable-next-line class-methods-use-this
  use(
    req: Parameters<RequestHandler>[0],
    res: Parameters<RequestHandler>[1],
    next: Parameters<RequestHandler>[2],
  ) {
    try {
      if (req.isAuthenticated() && req.user.authUser) {
        const { user: { authUser: user }, path } = req;
        info(loginLabels.userRequestedEndpoint(user.id, path));
        return next();
      }
      const { api } = endpoints;
      const prevURL = req.originalUrl.startsWith(api)
        ? req.headers.referer
        : req.originalUrl;
      return res.redirect(303, `${API.Users.Login.Route}?link=${encodeURIComponent(prevURL)}`);
    } catch (err) {
      serverError(`Auth middleware threw an error: ${err}`);
      return res.redirect(303, '/');
    }
  }
}
