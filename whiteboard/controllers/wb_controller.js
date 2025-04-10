'use strict'

const { generateUniqueCode, replyError, replySuccess } = require('../../core/core_funcs');
const { setCacheValue, getCacheValue } = require('../../core/redis_config/redis_client');
const { getUserSuggestions, create_room } = require('../services/wb_service');



async function GET_ROOM_ID(request, reply) {
    try {
        const room_id = request.params.roomId
        const messages = await getCacheValue(`chat:room:${room_id}`);
        const strokes = await getCacheValue(`Room:strokes:${room_id}`)
        return replySuccess(reply, { messages: (messages ? JSON.parse(messages) : []),  drowData: (strokes ? JSON.parse(strokes) : [])})
    } catch (err) {
        return replyError(reply, err)
    }
}

async function GET_USER_SUGGESTION(request, reply) {
    try {
        const userKeyword = request.params.userKeyword    
        const getSuggestions = await getUserSuggestions(this, userKeyword)
        return replySuccess(reply, { users : getSuggestions })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function CREATE_ROOM(request, reply) {
    try {
        const roomData = request.body
        const ownerDetails = request.user_info
        const insertRoomData = { ...roomData, owner_username: ownerDetails.username }
        
        const getSuggestions = await create_room(this, insertRoomData)
        return replySuccess(reply, { users : getSuggestions })
    } catch (err) {
        return replyError(reply, err)
    }
}


module.exports = {GET_ROOM_ID,GET_USER_SUGGESTION, CREATE_ROOM }