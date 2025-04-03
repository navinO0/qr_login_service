const pako = require("pako");
const { getCacheValue, setCacheValue } = require("../core/redis_config/redis_client");


let whiteboardData = {};
let cursors = {};
let roomLocks = {}; // Track which user is drawing

module.exports = function setupSocket(io, log) {
    io.on("connection", (socket) => {
        let customUserId = socket.handshake.query.username || `guest_${Math.floor(Math.random() * 10000)}`;


        log.info(`User connected: ${customUserId}`);

        io.to(socket.id).emit("custom-id", customUserId);

        socket.on("join-room", (roomId) => {
            socket.join(roomId);
            log.info(`User ${customUserId} joined room: ${roomId}`);

            if (!whiteboardData[roomId]) whiteboardData[roomId] = [];
            io.to(roomId).emit("lock", roomLocks[roomId]);
        });

        socket.on("draw", async ({ roomId, userId, paths }) => {
            whiteboardData[roomId] = paths;
            // log.info(`User ${userId} drew on room: ${roomId}`);

            const strokes = await getCacheValue(`Room:strokes:${roomId}`);
            const newStrokes = strokes ? [...JSON.parse(strokes), paths] : [paths];
            await setCacheValue(`Room:strokes:${roomId}`, JSON.stringify(newStrokes));

            socket.to(roomId).emit("draw", paths);
        });

        socket.on("clear", (roomId) => {
            whiteboardData[roomId] = [];
            socket.to(roomId).emit("clear");
        });

        socket.on("undo", (roomId) => socket.to(roomId).emit("undo"));
        socket.on("redo", (roomId) => socket.to(roomId).emit("redo"));

        socket.on("cursor-move", ({ roomId, userId, cursor }) => {
            if (!cursors[roomId]) cursors[roomId] = {};
            cursors[roomId][userId] = cursor;
            socket.to(roomId).emit("cursor-move", { userId, cursor });
        });

        socket.on("lock", ({ roomId, userId }) => {
            if (!roomLocks[roomId]) {
                roomLocks[roomId] = userId;
                log.info(`User ${userId} locked the whiteboard in room: ${roomId}`);
                io.to(roomId).emit("lock", userId);
            }
        });

        socket.on("unlock", (roomId) => {
            if (roomLocks[roomId]) {
                log.info(`User ${roomLocks[roomId]} unlocked the whiteboard in room: ${roomId}`);
                roomLocks[roomId] = null;
                io.to(roomId).emit("unlock");
            }
        });

        socket.on("message", async ({ id, roomId, userId, message, time }) => {
            log.info(`User ${userId} sent a message "${message}" in room: ${roomId}`);
            const newMessage = { id, userId, message, time };

            let messages = await getCacheValue(`chat:room:${roomId}`);
            messages = messages ? JSON.parse(messages) : [];
            messages.push(newMessage);
            setCacheValue(`chat:room:${roomId}`, JSON.stringify(messages));

            io.to(roomId).emit("message", newMessage);
        });

        socket.on("disconnect", () => {
            log.info(`User disconnected: ${customUserId}`);
        });
    });
};
