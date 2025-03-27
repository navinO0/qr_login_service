const { GET_ROOM_ID, SAVE_ROOM_ID } = require('./controllers/wb_controller');
const { room_id_schema, save_room_schema } = require('./schemas/wb_schema');
// const fastifyWebsocket = require('fastify-websocket');

module.exports = async (app) => {

app.route({
        method: 'GET',
        url: '/load/:roomId',
        schema: room_id_schema,
        handler: GET_ROOM_ID,
    });

    app.route({
        method: 'POST',
        url: '/save',
        schema: save_room_schema,
        handler: SAVE_ROOM_ID,
    });

};
