// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { IncomingMessage } from 'http';
import type { SessionData } from 'express-session';
import type { Socket } from 'socket.io';
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.pdf';
declare module '*.png';

declare module 'express-session' {
  interface SessionData {
    prevURL?: string;
    user: Express.User;
    passport: {
      user: Express.User;
    };
  }
}

interface SessionIncomingMessage extends IncomingMessage {
  session: SessionData;
  user?: Express.User;
}

export interface SessionSocket extends Socket {
  request: SessionIncomingMessage;
}
