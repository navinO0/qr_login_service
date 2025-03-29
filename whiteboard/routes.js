'use strict';

const loginRoutes = require('./index');
const { createServer } = require("http");
const { Server } = require("socket.io");
const { setCacheValue, deleteCacheValue } = require('../core/redis_config/redis_client');
const httpServer = createServer(this.server);
const io = new Server(httpServer, { cors: { origin: "*" } });

// io.on("connection", (socket) => {
//     console.log("User connected:", socket.id);

//     socket.on("join-room", (roomId) => {
//         socket.join(roomId);
//     });

//     socket.on("draw", async ({ roomId, paths }) => {
//         await setCacheValue(`whiteboard:${roomId}`, JSON.stringify(paths));
//         socket.to(roomId).emit("draw", paths);
//     });
   

//     socket.on("clear", async (roomId) => {
//         await deleteCacheValue(`whiteboard:${roomId}`);
//         io.to(roomId).emit("clear");
//     });

//     socket.on("disconnect", () => console.log("User disconnected"));
// }); 
// httpServer.listen(3009, () => {
//     console.log("🚀 Server running on http://localhost:4000");
// })
// console.log("uhewihdiuew")


module.exports = async (app) => {
    app.register(loginRoutes, { prefix: '/wb' });
};