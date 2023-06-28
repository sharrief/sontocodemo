/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-namespace */

declare global {
  namespace Express {
    type AppUser = import('../src/shared/interfaces/IUser').IUser;
    type AppApplication = import('../src/shared/interfaces/IApplication').IApplication;
    interface User {
      type?: 'user'|'application';
      authUser?: AppUser;
      application?: AppApplication;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type CallbackFunction = (err: string, ...args: any[]) => void

  namespace jest {
    interface Matchers<R> {
      toBeAmount(received: number): R;
    }
  }

}

export {};
