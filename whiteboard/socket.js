const mediasoup = require("mediasoup");
const pako = require("pako");
const { getCacheValue, setCacheValue } = require("../core/redis_config/redis_client");

let whiteboardData = {};
let cursors = {};
let roomLocks = {}; // Track which user is drawing
let worker, router, transports = {}, producers = {}, consumers = {}; // Mediasoup components

async function startMediasoup() {
    worker = await mediasoup.createWorker();
    router = await worker.createRouter({
        mediaCodecs: [
            { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
            { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
        ],
    });

    console.log("Mediasoup Router Ready!");
}

startMediasoup();

module.exports = async function setupSocket(io, log) {
     await startMediasoup()
    io.on("connection", async (socket) => {
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
            const newStrokes = strokes ? [...JSON.parse(strokes), ...paths] : [...paths];
            await setCacheValue(`Room:strokes:${roomId}`, JSON.stringify(newStrokes));

            socket.to(roomId).emit("draw", paths);
        });

        socket.on("clear", async(roomId) => {
            whiteboardData[roomId] = [];
            await setCacheValue(`Room:strokes:${roomId}`, JSON.stringify([]));
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

        

        // --- CREATE WEBRTC TRANSPORT ---
        socket.on("create-transport", async (_, callback) => {
            try {
                if (!router) {
                    return callback({ error: "Router not ready!" });
                }
        
                // Send router RTP Capabilities FIRST
                callback(router.rtpCapabilities);
            } catch (error) {
                console.error("Error getting router capabilities:", error);
                callback({ error: "Router initialization failed" });
            }
        });
        

        // --- CONNECT TRANSPORT ---
        socket.on("create-transport", async (_, callback) => {
            try {
                if (!router) {
                    return callback({ error: "Router not ready!" });
                }
        
                // Create WebRTC Transport
                const transport = await router.createWebRtcTransport({
                    listenIps: [{ ip: "0.0.0.0", announcedIp: "127.0.0.1" }], // Replace with actual public IP if needed
                    enableUdp: true,
                    enableTcp: true,
                    preferUdp: true,
                });
        
                // Store transport
                transports[socket.id] = transport;
        
                transport.on("dtlsstatechange", (state) => {
                    if (state === "closed") {
                        delete transports[socket.id];
                    }
                });
        
                console.log("Created WebRTC Transport:", transport.id);
        
                // Send correct transport parameters
                const response = {
                    id: transport.id, // Make sure the ID is present
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                };
        
                console.log("Transport response to frontend:", response); // Debugging log
        
                callback(response);
            } catch (error) {
                console.error("Error creating transport:", error);
                callback({ error: "Transport creation failed" });
            }
        });
        

        // --- PRODUCE MEDIA STREAM ---
        socket.on("produce", async ({ kind, rtpParameters }, callback) => {
            const transport = transports[socket.id];
            if (!transport) return callback({ error: "Transport not found" });

            const producer = await transport.produce({ kind, rtpParameters });
            producers[socket.id] = producer;

            callback({ id: producer.id });
        });

        // --- CONSUME MEDIA STREAM ---
        socket.on("consume", async ({ producerId, rtpCapabilities }, callback) => {
            if (!router.canConsume({ producerId, rtpCapabilities })) {
                return callback({ error: "Cannot consume" });
            }

            const transport = transports[socket.id];
            if (!transport) return callback({ error: "Transport not found" });

            const consumer = await transport.consume({
                producerId,
                rtpCapabilities,
                paused: true,
            });

            consumers[socket.id] = consumer;
            callback({
                id: consumer.id,
                producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
            });
        });

        socket.on("disconnect", () => {
            log.info(`User disconnected: ${customUserId}`);
            if (transports[socket.id]) {
                transports[socket.id].close();
                delete transports[socket.id];
            }
            if (producers[socket.id]) {
                producers[socket.id].close();
                delete producers[socket.id];
            }
            if (consumers[socket.id]) {
                consumers[socket.id].close();
                delete consumers[socket.id];
            }
        });
    });
};
