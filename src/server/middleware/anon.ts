import { ExpressMiddlewareInterface } from 'routing-controllers';
import passport from 'passport';
import { RequestHandler } from 'express';

export class AnonymousMiddleware implements ExpressMiddlewareInterface {
  // eslint-disable-next-line class-methods-use-this
  use(
    req: Parameters<RequestHandler>[0],
    _res: Parameters<RequestHandler>[1],
    next: Parameters<RequestHandler>[2],
  ) {
    if (req.user) {
      req.logout((err) => {
        if (err) return next(err);
        return req.session.regenerate(() => {
          passport.authenticate('anonymous');
          return next();
        });
      });
    }
    passport.authenticate('anonymous');
    return next();
  }
}
