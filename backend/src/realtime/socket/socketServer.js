const { Server } = require("socket.io");
const registerSocketHandlers = require("./socketHandlers");

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("error", (err) => {
      console.error(`Socket ${socket.id}:`, err?.message || err);
    });
    socket.on("disconnect", (reason) => {
      console.log(`${socket.id} disconnected: ${reason}`);
    });
    registerSocketHandlers(io, socket);
  });

  return io;
}

module.exports = initializeSocket;