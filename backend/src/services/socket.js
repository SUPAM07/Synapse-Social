import { Server } from 'socket.io';

export function initSocket(server, clientOrigin) {
  const io = new Server(server, {
    cors: { origin: clientOrigin, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('announce', (message) => {
      io.emit('announcement', { message, at: Date.now() });
    });
  });

  return io;
}


