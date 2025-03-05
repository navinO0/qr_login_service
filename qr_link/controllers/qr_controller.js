'use strict'

const { generateUniqueCode } = require('../../core/core_funcs');
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
    reply.send(userCreateResponse).status(200)
}


async function LOGIN(request, reply) {
    try {
        const { username, password } = request.body;
        const JWT_SECRET = 'CHITTIOOM';
        const user = await getUserDetails(this, username)
        if (!user) {
            return reply.status(401).send({ message: 'Username or password is incorrect' });
        }
        const isMatch = await verifyPassword(password, user.password)
        if (!isMatch) {
            return reply.status(401).send({ message: 'Username or password is incorrect' });
        }

        const token = jwt.sign(
            { username: user.username, email: user.email, first_name: user.first_name, middle_name: user.middle_name, last_name: user.middle_name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        reply.send({ token }).status(200)
    } catch (err) {
        console.log(err)
    }
}

async function GET_CODE(request, reply) {
    const token = request.token
    // const validateAndUserData = validateToken(token)
    const code = generateUniqueCode()
    await storeData(code, token, 360)
    const cachedData = await retrieveData(code)
    reply.send(code).status(200)
}

async function LOGIN_WITH_CODE(request, reply) {
    const loginCode = request.params.code
    const cachedData = await retrieveData(loginCode)
    if (!cachedData) {
        reply.send({status : 'failed', message : 'Invalid code or code has been expired'})
    }
    reply.send({
        status: 'success',
        token : cachedData
    })
}



module.exports = { GET_USERS, CREATE_USER, LOGIN, GET_CODE, LOGIN_WITH_CODE }