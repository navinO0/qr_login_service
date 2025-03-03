'use strict';

const { logger } = require('../qpf_common_modules');

function setTrapForUncaughtExceptions() {
    process.on('uncaughtException', err => {
        // eslint-disable-next-line no-console    
        err = err ? err : new Error('UNCAUGHT_EXCEPTION');
        console.error({
            "type": '[UNCAUGHT_EXCEPTION]',
            "date": `${new Date().toUTCString()}: Process will now exit. UncaughtException:`,
            "message": err.message || "UNCAUGHT_EXCEPTION",
            "error": err.stack
        });
        // eslint-disable-next-line no-process-exit   
        process.exit(1);
    });
}

module.exports = function setupAllShutdownHandlers({ app }) {
    async function closeDbConnection() {
        logger.info({ message: 'Closing DB connection...' });
        try {
            if (app && app.knex) {
                await app.knex.destroy();
            }
            logger.info({ message: 'DB connection successfully closed!' });
        } catch (err) {
            logger.error({ message: 'SERVER_SHUTDOWN closeDbConnection', err });
        }
    }

    async function closeServer() {
        logger.info({ message: 'Closing server connection...' });
        try {
            if (app && app.knex) {
                await app.close();
            }
            logger.info({ message: 'Server successfully closed!' });
        } catch (err) {
            logger.error({ message: 'SERVER_SHUTDOWN closeServer', err });
        }
    }

    function setupShutdownHandlersFor(signal) {
        process.on(signal, async function onSigterm() {
            try {
                logger.info({
                    message: `Got ${signal}. Graceful shutdown start ${new Date()}`
                });
                await closeDbConnection();
                await closeServer();
            } catch (err) {
                logger.error({
                    message: 'SERVER_SHUTDOWN signalHandler Could not shutdown everything cleanly!',
                    err
                });
            } finally {
                // eslint-disable-next-line no-process-exit
                process.exit();
            }
        });
    }

    setupShutdownHandlersFor('SIGINT');
    setupShutdownHandlersFor('SIGTERM');
    setTrapForUncaughtExceptions();
};
