'use strict'

const { generateUniqueCode, replyError, replySuccess } = require('../../core/core_funcs');
const { setCacheValue, getCacheValue } = require('../../core/redis_config/redis_client');



async function GET_ROOM_ID(request, reply) {
    try {
        const room_id = request.params.roomId
        const data = await getCacheValue(`chat:room:${room_id}`);
        return replySuccess(reply,(data ? JSON.parse(data) : []))
    } catch (err) {
        return replyError(reply, err)
    }
}

async function SAVE_ROOM_ID(request, reply) {
    try {
        const { roomId, paths } = request.body;
        await setCacheValue(`whiteboard:${roomId}`, JSON.stringify(paths));
        return replySuccess(reply, { message: 'success' })
    } catch (err) {
        return replyError(reply, err)
    }
}


module.exports = {GET_ROOM_ID,SAVE_ROOM_ID }