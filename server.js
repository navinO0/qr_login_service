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
const pino = require('pino');
const { ajvCompiler } = require('./qr_link/schemas/qr_schema');
const { v4: uuid } = require('uuid');
const { knexClientCreate } = require('./core/qpf_knex_query_builder');
const { validateAccessToken } = require('./core/token_generate_validate');

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

const APP_DB_CONFIG = {

    client: 'postgres',
    pool: {
        min: parseInt(3),
        max: parseInt(3000)
    },
    acquireConnectionTimeout: 30000,
    connection: {
        host: 'localhost',
        user: 'danvin',
        password: 'Password@123',
        database: 'testdb',
        port: '5432'
    },
    asyncStackTraces: false,
    debug: true,
    propagationError: false
};

async function serverSetup(swaggerURL) {
    try {
        const app = fastify({
            logger: true,
            genReqId: req => req.headers['x-request-id'] || uuid(),
            disableRequestLogging: true,  // Disable request logging
            bodyLimit: 5000000, // Setting body limit to 5 MB
        });
        // app.decorate('host_name', os.hostname());
        app.decorate('host_name', os.hostname());
        // global access of logs logger object
        app.register(require('@fastify/sensible'));
        // app.register(underPressure, underPressureConfig(swaggerURL));
        app.register(require('@fastify/formbody'));
        // app.register(multipart, { limits: { fileSize: app.config.FILE_SERVICE?.FILE_UPLOAD_LIMIT || 5000000 } });
        app.register(cors);
        app.register(helmet, helmetConfig);
        app.register(swagger, swaggerConfig(swaggerURL));
        app.register(swaggerUi, {
            routePrefix: swaggerURL + 'swagger/public/documentation', // This should be the same path as defined in swaggerConfig
        });
        await knexClientCreate(app, APP_DB_CONFIG, 'knex');
        app.addHook('onRequest', async (request, reply) => {
            return await validateAccessToken({ request }, reply, app);
        })

        // app.addHook('preValidation', requestContext);
        // if (!config.INSTANCE.INSTANCE_WSO2) {
        //     app.addHook('preValidation', RBAC);
        // }


        // app.addHook('preValidation', validateSchema);
        // app.addHook('preSerialization', appendPayloadToResponse);
        // app.addHook('onSend', onSend);
        // app.addHook('onResponse', onResponse);
        // if (config.INSTANCE.INSTANCE_WSO2) {
        //     app.addHook('onRequest', async (request, reply) => {
        //         return await validateWSO2AccessToken({ request }, reply, app);
        //     })
        // } else {
        //     app.addHook('onRequest', async (request, reply) => {
        //         return await validateAccessToken({ request }, reply, app);
        //     })
        // }
        await ajvCompiler(app, {});

        // setupGracefulShutdown ({ app: app });
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

const underPressureConfig = (url) => {
    url = url || 'qpf';
    return {
        exposeStatusRoute: {
            routeResponseSchemaOpts: {
                pg: { type: 'boolean' },
                redis: { type: 'boolean' },
                'cpu(%)': { type: 'number' },
            },
            url: url + "/public/status"
        },
        healthCheck: async function (app) {
            // TODO: Checking the connectivity of pg, redis and cpu
            function getCpuUsage() {
                const currentUsage = process.cpuUsage();
                const diff = {
                    user: currentUsage.user - lastUsage.user,
                    system: currentUsage.system - lastUsage.system
                };
                const percentUsage = ((100 * (diff.user + diff.system) / os.cpus().length) / 1000000).toFixed(2);
                lastUsage = currentUsage;
                return percentUsage;
            }

            let ser_health = {
                pg: false,
                redis: false,
                'cpu(%)': getCpuUsage()
            };

            try {
                ser_health.redis = app.redis.rClient.status === 'connect' || 'ready' ? true : false;
                try {
                    //Both primary and secondary dB must be healthy for the PG status to be true.
                    await app.knex.raw('select 1+1 as result');
                    await app.READ_DB.raw('select 1+1 as result');
                    ser_health.pg = true;
                } catch (error) {
                    ser_health.pg = false;
                }
                return ser_health;
            } catch (ex) {
                return ser_health;
            }
        },
        message: 'Under Pressure 😯'
    };
};




module.exports = { getAllRoutes, serverSetup }



