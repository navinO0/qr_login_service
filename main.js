const Fastify = require('fastify')


const fastify = Fastify({ logger: true })
const { serverSetup, getAllRoutes } = require('./server');
const path = require('path');
require('events').EventEmitter.defaultMaxListeners = 30;

const PORT = 3004;

const urlPrefix = "/users";


(async () => {
    try {
        const parentDirs = ['qr_link'];
        const server = await serverSetup(urlPrefix); // Initialize server before using it

        // Using for...of to handle async properly
        for (const parentDir of parentDirs) {
            let parentDirectory = path.resolve(__dirname, `./${parentDir}`);
            const routes = getAllRoutes(parentDirectory);
            for (const element of routes) {
                const route = require(element);
                server.register(route);
            }
        }

        // Start the server
        await server.listen({ port: PORT, host: '0.0.0.0' })
            .then((address) => {
                console.log("Everything is Loaded..!");
                console.log(
                    "Swagger URL: " + address + urlPrefix + "swagger/public/documentation"
                );
                console.log(
                    "Check server status URL: " + address + urlPrefix + "/public/status"
                );
            })
            .catch((err) => {
                throw new Error("Failed to start the server.", err);
            });;

        // console.log(server)


        // console.log('Everything is Loaded..!');
        // console.log('Swagger URL: http://0.0.0.0:3007/swagger/public/documentation');
        // console.log('Check server status URL: http://0.0.0.0:3007/public/status');

    } catch (err) {
        console.error('Error occurred:', err); // Use console.error for errors
        process.exit(1);
    }
})();





