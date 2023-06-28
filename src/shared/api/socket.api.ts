import { io, Socket } from 'socket.io-client';

const connectionOptions = {
  path: '/socket',
  withCredentials: true,
};
let socket: Socket = null;

function getConnection() {
  if (!socket) {
    socket = io(connectionOptions);
  }
  return socket;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function emit<D>(event: string, data?: D) {
  socket = getConnection();
  socket.emit(event, data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function on<D>(event: string, ack: (data?: D) => void) {
  socket = getConnection();
  socket.on(event, ack);
}

export function off(event: string) {
  socket = getConnection();
  socket.off(event);
}

export function disconnect() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
