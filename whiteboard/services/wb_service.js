'use strict'



const getUserSuggestions = async (app, userKeyword) => {

    try {
        const userData = await app.knex.raw(`SELECT json_agg(json_build_object('username', username, 'id', id)) as suggestions
            FROM users 
            WHERE username ILIKE '%${userKeyword}%';`)
        return userData.rows[0].suggestions.length > 0 ? userData.rows[0].suggestions : []
    } catch (err) {
        throw new Error("failed to get the users :" + err);
}
}


const create_room = async (app, roomData) => {

    try {
        const insertedRoom = await app.knex('rooms')
        .insert(roomData)
        .returning('*'); 
        return  insertedRoom
    } catch (err) {
        throw new Error("Failed to create the room :" + err);
}
}

const updateRoomUsers = async (app, roomId, customUserId) => {
    try {
        const room = await app.knex('rooms').where('id', roomId).first();
        if (!room) {
            app.kenx.insert({ room_id: roomId, owner_username: customUserId }).into('rooms');
        } else {
            const participantList = [customUserId];
            await app.knex('rooms')
              .where('room_id', roomId)
              .update({ participants: app.knex.raw('ARRAY[?]::text[]', [participantList]) });  
        }
        
    } catch (err) {
        throw new Error("Failed to update the room users :" + err);
    }
}

const getRoomChatData = async(app, roomId) => {
    try {
        const getQeury = `select json_agg(m.*) as messages from messages m where room_id = '${roomId}';`
        const roomData = await app.knex.raw(getQeury)
        return roomData?.rows[0]?.messages?.length >0 ? roomData.rows[0].messages : []
    } catch (err) {
        throw new Error("Failed to get the room chat data :" + err);
    }
   }


   const join_room = async (app, roomId, username, password) => {
    try {
        const room = await app.knex('rooms').where('room_id', roomId).first();
        if (room && room?.participants.includes(username)) {
            return ({status: true})
        }
        if(room && room?.is_private && password &&  room?.password !== password) {
            return ({status: false, code : "INVALID_PASSWORD"});
        }
        if(room && room?.is_private && !password) {
            return ({status: false, code : "PASSWORD_REQUIRED"})
        }

        if (!room) {
            app.knex.insert({ room_id: roomId, owner_username: username , is_private: false }).into('rooms');
        } else {
            // const participantList = [username];
            await app.knex('rooms')
            .where('room_id', roomId)
            .update({
              participants: app.knex.raw('array_cat(participants, ?::text[])', [[username]])
            });
            
        }
        
    } catch (err) {
        throw new Error("Failed to update the room users :" + err);
    }
}

const getRoom = async (app, roomId) => {
    try {
        const room = await app.knex('rooms').where('room_id', roomId).first();
        return room
    } catch (err) {
        throw new Error("Failed to update the room users :" + err);
    }
}


module.exports = {getUserSuggestions, create_room, updateRoomUsers, getRoomChatData, join_room, getRoom}