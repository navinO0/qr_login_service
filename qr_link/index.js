const { CREATE_USER, LOGIN, GET_CODE, LOGIN_WITH_CODE, GET_IMAGE, GET_ROOM_ID, SAVE_ROOM_ID, REGISTER_GOOGLE_AUTH, GET_DEVICES, REMOVE_DEVICE } = require('./controllers/qr_controller');
const { user_create_schema, user_login_schema, lgin_code_schema, login_with_code, image_schema, room_id_schema, save_room_schema, register_google_user_schema, get_devices_schema, remove_all_devices_schema } = require('./schemas/qr_schema');
// const fastifyWebsocket = require('fastify-websocket');

module.exports = async (app) => {
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

    app.route({
        method: 'GET',
        url: '/get/image',
        schema: image_schema,
        handler: GET_IMAGE,
    });
    
    app.route({
        method: 'POST',
        url: '/public/register',
        schema: register_google_user_schema,
        handler: REGISTER_GOOGLE_AUTH,
    });

    // app.route({
    //     method: 'POST',
    //     url: '/login/save',
    //     schema: save_room_schema,
    //     handler: SAVE_ROOM_ID,
    // }); 

    app.route({
        method: 'GET',
        url: '/get/devices',
        schema: get_devices_schema,
        handler: GET_DEVICES,
    });

       app.route({
        method: 'POST',
        url: '/delete/devices',
        schema: remove_all_devices_schema,
        handler: REMOVE_DEVICE,
    });

};
