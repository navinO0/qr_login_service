'use strict'

const fs = require('fs');
const path = require('path');
require('make-promises-safe');
const fastify = require('fastify');
const { createServer } = require('http'); // Import HTTP server
const { Server } = require('socket.io'); // Import Socket.io
const Redis = require('ioredis'); // Import Redis
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const os = require('os');
const { ajvCompiler } = require('./qr_link/schemas/qr_schema');
const { v4: uuid } = require('uuid');
const { knexClientCreate } = require('./core/qpf_knex_query_builder');
const { validateAccessToken } = require('./core/token_generate_validate');
const CONFIG = require('./core/config');
const { redisClientCreate } = require('./core/redis_config');
const throttle = require("lodash/throttle");
const { setCacheValue, deleteCacheValue } = require('./core/redis_config/redis_client');
const pako = require("pako");


function getAllRoutes(filePath, routes = []) {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
        const files = fs.readdirSync(filePath);
        files.forEach((file) => {
            if (file !== "node_modules") {
                const fullPath = path.join(filePath, file);
                if (!file.startsWith(".")) {
                    getAllRoutes(fullPath, routes);
                }
            }
        });
    } else if (stats.isFile() && path.basename(filePath) === "routes.js") {
        routes.push(filePath);
    }
    return routes;
}

const helmetConfig = {
    noCache: true,
    policy: 'same-origin',
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            imgSrc: ["'self'", 'data:'],
            scriptSrc: ["'self' 'unsafe-inline'"]
        }
    }
}

async function serverSetup(swaggerURL) {
    try {
        const app = fastify({
            logger: true,
            genReqId: req => req.headers['x-request-id'] || uuid(),
            disableRequestLogging: true,
            bodyLimit: 5000000,
        });

        const httpServer = createServer(app.server); // Create an HTTP server
        const io = new Server(httpServer, { cors: { origin: "*" } }); // Attach Socket.io

        const redis = new Redis(); // Connect to Redis at localhost:6379

        app.decorate('host_name', os.hostname());
        app.decorate('CONFIG', CONFIG);
        app.register(require('@fastify/sensible'));
        app.register(require('@fastify/formbody'));
        app.register(cors);
        app.register(helmet, helmetConfig);
        app.register(swagger, swaggerConfig(swaggerURL));
        app.register(swaggerUi, {
            routePrefix: swaggerURL + 'swagger/public/documentation',
        });

        // Redis & Database Setup
        await redisClientCreate(app, CONFIG.REDIS, 'redis');
        await knexClientCreate(app, CONFIG.APP_DB_CONFIG, 'knex');

        app.addHook('onRequest', async (request, reply) => {
            return await validateAccessToken({ request }, reply, app);
        });

        await ajvCompiler(app, {});

        // WebSocket Events
       
// io.on("connection", (socket) => {
//     console.log("User connected:", socket.id);

//     socket.on("join-room", async (roomId) => {
//         socket.join(roomId);
//         console.log(`User joined room: ${roomId}`);

//         // Load cached data if available
//         const cachedPaths = await redis.get(`whiteboard:${roomId}`);
//         if (cachedPaths) {
//             socket.emit("draw", JSON.parse(cachedPaths));
//         }
//     });

//     socket.on("draw", async ({ roomId, paths }) => {
//         // await setCacheValue(`whiteboard:${roomId}`, JSON.stringify(paths), "EX", 3600);
//         io.to(roomId).emit("draw", paths);
//     });

//     socket.on("undo", (roomId) => io.to(roomId).emit("undo"));
//     socket.on("redo", (roomId) => io.to(roomId).emit("redo"));

//     socket.on("clear", async (roomId) => {
//         // await deleteCacheValue(`whiteboard:${roomId}`);
//         io.to(roomId).emit("clear");
//     });

//     socket.on(
//         "cursor-move",
//         throttle(({ roomId, userId, cursor }) => {
//             io.to(roomId).emit("cursor-move", { userId, cursor });
//         }, 200) // Reduced throttle for smoother cursor movement
//     );

//     socket.on("disconnect", () => console.log("User disconnected:", socket.id));
// });

// // Start the server with WebSocket support
// httpServer.listen(4000, () => {
//     console.log("🚀 Server running on http://localhost:4000");
// });

let whiteboardData = {};
let cursors = {};

io.on("connection", (socket) => {
    let customUserId = socket.handshake.query.userId || `guest_${Math.floor(Math.random() * 10000)}`;

    console.log("User connected:", customUserId);

    // Send the assigned custom ID back to the client
    io.to(socket.id).emit("custom-id", customUserId);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`User ${customUserId} joined room: ${roomId}`);

        // Initialize room data if not present
        if (!whiteboardData[roomId]) whiteboardData[roomId] = [];
        // if (!cursors[roomId]) cursors[roomId] = {};

        // Send existing drawing data to the new user
        // const compressedData = pako.deflate(JSON.stringify(whiteboardData[roomId]), { to: "string" });
        // io.to(socket.id).emit("sync", compressedData);
    });

    // Handle drawing updates
    socket.on("draw", ({ roomId, paths }) => {
        whiteboardData[roomId] = paths;
        socket.to(roomId).emit("draw", paths);
    })

    // Handle clearing the whiteboard
    socket.on("clear", (roomId) => {
        whiteboardData[roomId] = [];
        socket.to(roomId).emit("clear");
    });

    // Handle undo/redo
    socket.on("undo", (roomId) => socket.to(roomId).emit("undo"));
    socket.on("redo", (roomId) => socket.to(roomId).emit("redo"));

    // Handle cursor movement
    socket.on("cursor-move", ({ roomId, userId, cursor }) => {
        if (!cursors[roomId]) cursors[roomId] = {};
        cursors[roomId][userId] = cursor;

        socket.to(roomId).emit("cursor-move", { userId, cursor });
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${customUserId}`);
    });
});

httpServer.listen(3008, () => console.log("🚀 Server running on http://localhost:4000"));

        return app;
    } catch (err) {
        console.log(err);
    }
};

const swaggerConfig = (url) => {
    url = url || 'http://localhost:3007';
    return {
        routePrefix: url + 'swagger/public/documentation',
        swagger: {
            info: {
                title: 'Swagger',
                description: 'Swagger for the project',
                version: '1.0.0'
            },
            schemes: ['http', 'https'],
            rbac: ['*'],
            consumes: [
                'application/json',
                'application/x-www-form-urlencoded',
                'application/xml',
                'text/xml'
            ],
            produces: [
                'application/json',
                'application/javascript',
                'application/xml',
                'text/xml',
                'text/javascript'
            ],
            securityDefinitions: {
                ApiToken: {
                    description: 'Authorization header token, sample: "Bearer #TOKEN#"',
                    type: 'apiKey',
                    name: 'Authorization',
                    in: 'header'
                },
                StaticToken: {
                    description: 'Add the Static token : "Static Token"',
                    type: 'apiKey',
                    name: 'qp-tc-request-id',
                    in: 'header'
                }
            }
        },
        exposeRoute: true
    };
};

process.on('uncaughtException', (err) => {
    console.log(err ? err : "UNCAUGHT_EXCEPTION");
    setTimeout(() => {
        process.exit(1)
    })
});

module.exports = { getAllRoutes, serverSetup };
