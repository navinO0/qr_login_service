const { GET_ROOM_ID, SAVE_ROOM_ID, GET_USER_SUGGESTION, CREATE_ROOM, JOIN_ROOM } = require('./controllers/wb_controller');
const { room_id_schema, save_room_schema, getUsersSchema, create_room_schema, join_room_schema } = require('./schemas/wb_schema');
// const fastifyWebsocket = require('fastify-websocket');

module.exports = async (app) => {

app.route({
        method: 'GET',
        url: '/load/:roomId',
        schema: room_id_schema,
        handler: GET_ROOM_ID,
    });

    app.route({
        method: 'GET',
        url: '/get/users/:userKeyword',
        schema: getUsersSchema,
        handler: GET_USER_SUGGESTION,
    });


    app.route({
        method: 'POST',
        url: '/room/create',
        schema: create_room_schema,
        handler: CREATE_ROOM,
    });

    app.route({
        method: 'POST',
        url: '/room/join',
        schema: join_room_schema,
        handler: JOIN_ROOM,
    });
};
