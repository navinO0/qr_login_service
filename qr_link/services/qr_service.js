'use strict'

const createUser = async(app, userDetails) => {
    try {
        const [response] = await app.knex('users')
    .insert(userDetails)
    .returning(['username', 'email', 'mobile', 'first_name', 'middle_name', 'last_name']);

return response;
    } catch (error) {
        throw new Error("user creation failed :" + error);   
    }
}


const getUserDetails = async (app, username) => {
    try {
        const user = await app.knex.raw(`select username, email, mobile, first_name, middle_name,password, last_name from users where username = '${username}';`)
        return user.rows ? user.rows[0] : {}
    } catch (err) {
        throw new Error("Failed to fetch the user deatils :" + err);
    }
    
}

const getUserImage = async (app, username) => {
    try {
        const user = await app.knex.raw(`select profile_photo from users where username = '${username}';`)
        return user.rows ? user.rows[0] : {}
    } catch (err) {
        throw new Error("Failed to fetch the user Image :" + err);
    }
    
}

module.exports = {createUser, getUserDetails, getUserImage }