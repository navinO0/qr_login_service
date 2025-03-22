'use strict'

const { generateUniqueCode, replyError, replySuccess } = require('../../core/core_funcs');
const { decryptObject } = require('../../core/crypto');
const { hashPassword, verifyPassword } = require('../../core/password_enc_desc');
const { storeData, retrieveData, deleteData } = require('../../core/redis');
const { setCacheValue, deleteCacheValue, getCacheValue } = require('../../core/redis_config/redis_client');
const { runBasicQery, createUser, getUserDetails, getUserImage } = require('../services/qr_service')
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
        const body = request.body;
        const JWT_SECRET = this.CONFIG.SECURITY_KEYS.JWT_SECRET;
        // Decrypt the incoming request body
        const { username, password, email, mobile, first_name, last_name, middle_name, profile_photo } = decryptObject(this, body,['username','email','mobile','first_name','middle_name', "password", 'last_name']);
        const user = await getUserDetails(this, username)
        if (user && user !== "") {
            throw new Error("username not available");
        }
        // Validation regex patterns
        const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobilePattern = /^\d{10}$/;
        const namePattern = /^[a-zA-Z]{2,30}$/;

        // Validation checks
        if (!usernamePattern.test(username)) {
            throw new Error("Invalid username. Must be 3-20 characters long and contain only letters, numbers, or underscores.");
        }
        if (!emailPattern.test(email)) {
            throw new Error("Invalid email format.");
        }
        if (!mobilePattern.test(mobile)) {
            throw new Error("Invalid mobile number. Must be exactly 10 digits.");
        }
        if (!namePattern.test(first_name) || !namePattern.test(last_name)) {
            throw new Error("First name and last name must be between 2-30 alphabetic characters.");
        }
        if (middle_name && !namePattern.test(middle_name)) {
            throw new Error("Middle name must be between 2-30 alphabetic characters (if provided).");
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create user object
        const userDetails = {
            username,
            email,
            password: hashedPassword,
            mobile,
            first_name,
            last_name,
            middle_name,
            profile_photo
        };

        // Create user in the system
        const userCreateResponse = await createUser(this, userDetails);
        const token = jwt.sign(
            userCreateResponse,
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        return replySuccess(reply, { token });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}


async function LOGIN(request, reply) {
    try {
        const body = request.body;
        const JWT_SECRET = this.CONFIG.SECURITY_KEYS.JWT_SECRET;
        const { username, password } = decryptObject(this, body,['username','password'])
        const user = await getUserDetails(this, username)
        if (!user) {
            return replyError(reply, { message: 'Username or password is incorrect' })
        }
        const isMatch = await verifyPassword(password, user.password)
        if (!isMatch) {
            return replyError(reply, { message: 'Username or password is incorrect' })
        }
        delete user.password
        const token = jwt.sign(
            user,
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
        await setCacheValue(code, token, 300)
        return replySuccess(reply, { code })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function LOGIN_WITH_CODE(request, reply) {
    try {
        const loginCode = request.params.code
        const cachedData = await getCacheValue(loginCode)
        if (!cachedData) {
            return replyError(reply, { message: 'invalid code or code has been expired' })
        }
        deleteCacheValue(loginCode)
        return replySuccess(reply, { message: 'login success', token: cachedData })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function GET_IMAGE(request, reply) {
    try {
        const username = request.user_info.username
        const img_data = await getUserImage(this, username)
        return replySuccess(reply, { message: 'success', image: img_data.profile_photo })
    } catch (err) {
        return replyError(reply, err)
    }
}


module.exports = { GET_USERS, CREATE_USER, LOGIN, GET_CODE, LOGIN_WITH_CODE, GET_IMAGE }