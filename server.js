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
const { setCacheValue, deleteCacheValue, getCacheValue } = require('./core/redis_config/redis_client');
const pako = require("pako");
const fastifyCors = require("@fastify/cors");
const pino = require('pino');
const cronScheduler = require('./core/scheduler/scheduler');
const cronPlugin = require('./core/scheduler/scheduler');
const setupSocket = require('./whiteboard/socket');
const { logger } = require('./core/logger/logger')
const mediasoup = require("mediasoup");
const io = require("socket.io")(fastify.server, {
    cors: {
        origin: "*", // Adjust as per your needs
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"], // Ensure WebSockets are enabled
});

let worker, router;

// const logger = pino({
//     level: 'info',
//     transport: {
//         target: 'pino-pretty',
//         options: { colorize: true }
//     }
// });

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

        const httpServer = createServer(app.server);
        const io = new Server(httpServer, { cors: { origin: "*" } });
        app.decorate('io', io);
        setupSocket(io, app.log);
        app.decorate('host_name', os.hostname());
        app.decorate('CONFIG', CONFIG);
        app.register(require('@fastify/sensible'));
        app.register(require('@fastify/formbody'));
        app.register(fastifyCors, {
            origin: true,
            credentials: true,
        });
        app.register(helmet, helmetConfig);
        app.register(swagger, swaggerConfig(swaggerURL));
        app.register(swaggerUi, {
            routePrefix: swaggerURL + 'swagger/public/documentation',
        });
        app.addHook('onRequest', async (request, reply) => {
            request.log.info({
                method: request.method,
                url: request.url,
                // headers: request.headers, 
                body: request.body
            }, 'Incoming Request');
        });

        app.addHook('onResponse', async (request, reply) => {
            request.log.info({
                statusCode: reply.statusCode,
                responseTime: reply.getResponseTime()
            }, 'Response Sent');
        });

        // Redis & Database Setup
        await redisClientCreate(app, CONFIG.REDIS, 'redis');
        await knexClientCreate(app, CONFIG.APP_DB_CONFIG, 'knex');

        app.addHook('onRequest', async (request, reply) => {
            return await validateAccessToken({ request }, reply, app);
        });

        await app.register(cronPlugin);

        await ajvCompiler(app, {});


        httpServer.listen(CONFIG.SOCKET_PORT, () => app.log.info(`Socket Server running on ${CONFIG.HOST}:${CONFIG.SOCKET_PORT}`));

        return app;
    } catch (err) {
        logger.error(err, "Server setup error");
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
    logger.error(err, "UNCAUGHT_EXCEPTION");
    setTimeout(() => {
        process.exit(1);
    })
});

module.exports = { getAllRoutes, serverSetup, logger };
