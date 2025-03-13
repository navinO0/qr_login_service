const { CREATE_USER, LOGIN, GET_CODE, LOGIN_WITH_CODE } = require('./controllers/qr_controller');
const { user_create_schema, user_login_schema, lgin_code_schema, login_with_code } = require('./schemas/qr_schema');
// const fastifyWebsocket = require('fastify-websocket');

module.exports = async (app) => {
    // Register WebSocket plugin
    // app.register(fastifyWebsocket);

    // REST API routes
    app.route({
        method: 'POST',
        url: '/public/create',
        schema: user_create_schema,
        handler: CREATE_USER,
    });

    app.route({
        method: 'POST',
        url: '/public/login',
        schema: user_login_schema,
        handler: LOGIN,
    });

    app.route({
        method: 'POST',
        url: '/get/code',
        schema: lgin_code_schema,
        handler: GET_CODE,
    });

    app.route({
        method: 'POST',
        url: '/login/code/:code',
        schema: login_with_code,
        handler: LOGIN_WITH_CODE,
    });
};
