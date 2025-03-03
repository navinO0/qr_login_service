'use strict';

const loginRoutes = require('./index');

module.exports = async (app) => {
    // app.setErrorHandler(errorHandler);
    app.register(loginRoutes, { prefix: '/login' });
};