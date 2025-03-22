'use strict'

const fs = require('fs');
const path = require('path');
require('make-promises-safe');
const fastify = require('fastify')
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const os = require('os');
const { ajvCompiler } = require('./qr_link/schemas/qr_schema');
const { v4: uuid } = require('uuid');
const { knexClientCreate } = require('./core/qpf_knex_query_builder');
const { validateAccessToken } = require('./core/token_generate_validate');
const  CONFIG  = require('./core/config');
const { redisClientCreate } = require('./core/redis_config');

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
            disableRequestLogging: true,  // Disable request logging
            bodyLimit: 5000000, // Setting body limit to 5 MB
        });
        app.decorate('host_name', os.hostname());
        app.decorate('CONFIG', CONFIG)
        app.register(require('@fastify/sensible'));
        app.register(require('@fastify/formbody'));
        app.register(cors);
        app.register(helmet, helmetConfig);
        app.register(swagger, swaggerConfig(swaggerURL));
        app.register(swaggerUi, {
            routePrefix: swaggerURL + 'swagger/public/documentation', // This should be the same path as defined in swaggerConfig
        });
        await redisClientCreate(app, CONFIG.REDIS, 'redis')
        await knexClientCreate(app, CONFIG.APP_DB_CONFIG, 'knex');
        app.addHook('onRequest', async (request, reply) => {
            return await validateAccessToken({ request }, reply, app);
        })
        await ajvCompiler(app, {});
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
})

module.exports = { getAllRoutes, serverSetup }



