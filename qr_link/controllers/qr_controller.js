'use strict'

const { generateUniqueCode, replyError, replySuccess } = require('../../core/core_funcs');
const { hashPassword, verifyPassword } = require('../../core/password_enc_desc');
const { storeData, retrieveData } = require('../../core/redis');
const { validateToken } = require('../../core/token_generate_validate');
const {runBasicQery, createUser, getUserDetails} = require('../services/qr_service')
const jwt = require('jsonwebtoken');

async function GET_USERS(request, reply) {
    const body = request.body
    const few = 'varuable'
    console.log(few)
    const response = await runBasicQery(this)
    reply.send(response).status(200)
}


async function CREATE_USER(request, reply) {
    try {
    const body = request.body
    const hashedPassword = await hashPassword(body.password)
    const userDetails = {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        mobile: body.mobile,
        first_name: body.first_name,
        last_name: body.last_name,
        middle_name: body.middle_name
    }

    const userCreateResponse = await createUser(this, userDetails)
        return replySuccess(reply, userCreateResponse)
    } catch (err) {
       return replyError(reply, err)
    }
}


async function LOGIN(request, reply) {
    try {
        const { username, password } = request.body;
        const JWT_SECRET = 'CHITTIOOM';
        const user = await getUserDetails(this, username)
        if (!user) {
            return replyError(reply, { message: 'Username or password is incorrect' })
        }
        const isMatch = await verifyPassword(password, user.password)
        if (!isMatch) {
            return replyError(reply, { message: 'Username or password is incorrect' })
        }

        const token = jwt.sign(
            { username: user.username, email: user.email, first_name: user.first_name, middle_name: user.middle_name, last_name: user.middle_name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return replySuccess(reply, { token })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function GET_CODE(request, reply) {
    try {
        const token = request.token
        const code = generateUniqueCode()
        await storeData(code, token, 3600)
        return replySuccess(reply, {code})
    } catch (err) {
        return replyError(reply, err)
    } 
}

async function LOGIN_WITH_CODE(request, reply) {
    try {
        const loginCode = request.params.code
        const cachedData = await retrieveData(loginCode)
        if (!cachedData) {
            return replyError(reply, { message: 'invalid code or code has been expired' })
        }
        return replySuccess(reply, { message: 'login success', token : cachedData })
    } catch (err) {
        return replyError(reply, err)
    }
}



module.exports = { GET_USERS, CREATE_USER, LOGIN, GET_CODE, LOGIN_WITH_CODE }