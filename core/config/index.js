require("dotenv").config(); // Load environment variables

const CONFIG = {
    APP_DB_CONFIG: {
        client: process.env.DB_CLIENT || 'postgres',
        pool: {
            min: parseInt(process.env.DB_POOL_MIN) || 3,
            max: parseInt(process.env.DB_POOL_MAX) || 3000,
        },
        acquireConnectionTimeout: parseInt(process.env.DB_TIMEOUT) || 30000,
        connection: {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'danvin',
            password: process.env.DB_PASSWORD || 'Pass',
            database: process.env.DB_DATABASE || 'postgres',
            port: process.env.DB_PORT || '5432',
        },
        asyncStackTraces: process.env.DB_ASYNC_STACK_TRACES === 'true',
        debug: process.env.DB_DEBUG === 'true',
        propagationError: process.env.DB_PROPAGATION_ERROR === 'true',
    },

    REDIS: {
            host: process.env.REDIS_HOST || "localhost", // Change to your Redis server host
            port: process.env.REDIS_PORT || 6379, // Default Redis port
    },

    POSTGRES_CONFIG: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'danvin',
        password: process.env.DB_PASSWORD || 'Password@123',
        database: process.env.DB_DATABASE || 'testdb',
        port: process.env.DB_PORT || '5432',
    },

    SECURITY_KEYS: {
        KEY_HEX: process.env.KEY_HEX || "51d50fd2414f785fdd9cd1d7d6b98cbca8ce426b4f39a79affd9d900ca8d7eeb",
        IV_HEX: process.env.IV_HEX || "cc6f3e4f66ad34ade65e3e67fb96856c",
        JWT_SECRET: process.env.JWT_SECRET || "XXXXX",
    }
};

module.exports = CONFIG;