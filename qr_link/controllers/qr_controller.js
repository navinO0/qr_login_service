'use strict'

const { generateUniqueCode, replyError, replySuccess } = require('../../core/core_funcs');
const { decryptObject } = require('../../core/crypto');
const { hashPassword, verifyPassword } = require('../../core/password_enc_desc');
const { setCacheValue, deleteCacheValue, getCacheValue } = require('../../core/redis_config/redis_client');
const { genereateToke, decodeToken } = require('../../core/token_generate_validate');
const { createUser, getUserDetails, getUserImage } = require('../services/qr_service')
const jwt = require('jsonwebtoken');

async function CREATE_USER(request, reply) {
    try {
        const body = request.body;
        // Decrypt the incoming request body
        const device_info = request.body.device_info
        const { username, password, email, mobile, first_name, last_name, middle_name, profile_photo } = decryptObject(this, body,['username','email','mobile','first_name','middle_name', "password", 'last_name']);
        const user = await getUserDetails(this, username)
        if (user && user !== "") {
            throw new Error("username not available");
        }
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
        if (!namePattern.test(first_name)) {
            throw new Error("First name and last name must be between 2-30 alphabetic characters.");
        }
        if (middle_name && !namePattern.test(middle_name)) {
            throw new Error("Middle name must be between 2-30 alphabetic characters (if provided).");
        }

        if (last_name &&  !namePattern.test(last_name)) {
            throw new Error("last name must be between 2-30 alphabetic characters (if provided).");
        }

        const hashedPassword = await hashPassword(password);

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

        const userCreateResponse = await createUser(this, userDetails);
        const token = await genereateToke(this, userCreateResponse, device_info)
        return replySuccess(reply, { token });
    } catch (err) {
        return replyError(reply, { message: err.message });
    }
}


async function LOGIN(request, reply) {
    try {
        const body = request.body;
        const {device_info} = request.body
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
        const token = await genereateToke(this, user, device_info)
        return replySuccess(reply, { token })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function GET_CODE(request, reply) {
    try {
        const token = request.token
        const code = generateUniqueCode()
        await setCacheValue(code, token, this.CONFIG.REDIS.QR_CODE_EXPIRY_IN_SECS)
        return replySuccess(reply, { code })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function LOGIN_WITH_CODE(request, reply) {
    try {
        const loginCode = request.params.code
        const { device_info } = request.body
        const cachedData_code = await getCacheValue(loginCode)
        if (!cachedData_code) {
            return replyError(reply, { message: 'invalid code or code has been expired' })
        }
        const userdata = await decodeToken(cachedData_code)
        delete userdata.exp
        // deleteCacheValue(loginCode)
        // await setCacheValue(cachedData, (getDevicesCount ? parseInt(getDevicesCount) + 1 : 1), this.CONFIG.REDIS.TOKEN_EXPIRY_IN_SECS)
        const cachedData = await getCacheValue(userdata.username + this.CONFIG.REDIS.DEVICES_KEY)
        if (cachedData) {
            const devices = JSON.parse(cachedData)
            if (devices.length > 2) {
                return replyError(reply, { message: 'device limit exceeded' })
            }
            const exist = devices.find(e => e.
                fingerprint === device_info.
                    fingerprint)
            if (exist) {
                const token = await genereateToke(this, userdata, device_info)
                return replySuccess(reply, { message: 'login success', token })
            }
            devices.push(device_info)
            await setCacheValue(userdata.username + this.CONFIG.REDIS.DEVICES_KEY, JSON.stringify(devices))
        }
        const token = await genereateToke(this, userdata, device_info)
        return replySuccess(reply, { message: 'login success', token })
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

async function GET_ROOM_ID(request, reply) {
    try {
        const token = request.token
        const code = generateUniqueCode()
        await getCacheValue(code, token, this.CONFIG.REDIS.QR_CODE_EXPIRY_IN_SECS)
        return replySuccess(reply, { code })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function SAVE_ROOM_ID(request, reply) {
    try {
        const { roomId, paths } = request.body;
        await redis.set(`whiteboard:${roomId}`, JSON.stringify(paths));
        await setCacheValue((`whiteboard:${roomId}`, JSON.stringify(paths), this.CONFIG.REDIS.WHITEBOARD_EXPIRY_IN_SECS))
        return replySuccess(reply, { message: 'success' })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function REGISTER_GOOGLE_AUTH(request, reply) {
    try {
        const body = request.body;
        const { username, email,first_name, profile_photo } = decryptObject(this, body,['username','email','first_name']);
        const user = await getUserDetails(this, username)
        if (user && user !== "") {
           return replySuccess(reply, { message: "User already registered" })
        }

        const userDetails = {
            username,
            email,
            first_name,
            profile_photo,
            password : ''
        };

        await createUser(this, userDetails);
        return replySuccess(reply, { message: 'success' })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function GET_DEVICES(request, reply) {
    try {
        const token = request.token
        const userdata = await decodeToken(token)
        const cachedData = await getCacheValue(userdata.username + this.CONFIG.REDIS.DEVICES_KEY)
        const devices = JSON.parse(cachedData)
        return replySuccess(reply, { devices })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function REMOVE_DEVICE(request, reply) {
    try {
        const token = request.token
        const is_remove_all_devices = request.body.is_remove_all_devices
        const userdata = await decodeToken(token)
        const cachedData = await getCacheValue(userdata.username + this.CONFIG.REDIS.DEVICES_KEY)
        const devices = JSON.parse(cachedData)
        is_remove_all_devices ? await setCacheValue(userdata.username + this.CONFIG.REDIS.DEVICES_KEY, JSON.stringify([])) : await setCacheValue(userdata.username + this.CONFIG.REDIS.DEVICES_KEY, JSON.stringify(devices.filter(e => e.fingerprint !== request.body.device_fingerprint)))
        return replySuccess(reply, { message: 'device removed successfully' })
    } catch (err) {
        return replyError(reply, err)
    }
}


module.exports = {CREATE_USER, LOGIN, GET_CODE, LOGIN_WITH_CODE, GET_IMAGE,GET_ROOM_ID,SAVE_ROOM_ID, REGISTER_GOOGLE_AUTH, GET_DEVICES, REMOVE_DEVICE }