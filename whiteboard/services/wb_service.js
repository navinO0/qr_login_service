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
        .returning('*'); // Returns the inserted row(s)
   
        return  insertedRoom
    } catch (err) {
        throw new Error("Failed to create the room :" + err);
}
}
module.exports = {getUserSuggestions, create_room}