'use strict'

const { replyError, replySuccess } = require('../../core/core_funcs');
const {  getCacheValue } = require('../../core/redis_config/redis_client');
const { getUserSuggestions, create_room, getRoomChatData, join_room, getRoom } = require('../services/wb_service');



async function GET_ROOM_ID(request, reply) {
    try {
        const room_id = request.params.roomId
        const messages = await getCacheValue(`${this.CONFIG.REDIS.MESSAGES_KEY}${room_id}`);
        const strokes = await getCacheValue(`${this.CONFIG.REDIS.STROKES_KEY}${room_id}`)
        const msgsFromDb = await getRoomChatData(this, room_id)
        return replySuccess(reply, {
            messages: (() => {
              if (messages?.length) {
                if (msgsFromDb?.length) {
                  return [...msgsFromDb, ...JSON.parse(messages)];
                } else {
                  return JSON.parse(messages);
                }
              } else {
                return msgsFromDb?.length ? msgsFromDb : [];
              }
            })(),
            drowData: strokes?.length ? JSON.parse(strokes) : []
          });
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
        const checkIfRoomExists = await getRoom(this, roomData.room_id)
        if(checkIfRoomExists && checkIfRoomExists.room_id.length) {
            return replyError(reply, { message: 'Room already exists' })
        }
        const getSuggestions = await create_room(this, insertRoomData)
        return replySuccess(reply, { users : getSuggestions })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function JOIN_ROOM(request, reply) {
    try {
        const { room_id, password } = request.body
        const username = request.user_info.username
        const join_result = await join_room(this, room_id, username, password)
        if(join_result && !join_result?.status) {
            return replyError(reply, join_result)
        }
        return replySuccess(reply, { join_result })
    } catch (err) {
        return replyError(reply, err)
    }
}


module.exports = {GET_ROOM_ID,GET_USER_SUGGESTION, CREATE_ROOM, JOIN_ROOM }