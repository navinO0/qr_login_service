
const jwt = require('jsonwebtoken');
const { getCacheValue, setCacheValue } = require('../redis_config/redis_client');
const CONFIG = require('../config');
const genereateToke = async(app, userdata) => {

    // Generate a JWT token
    const token = jwt.sign(
        userdata,
        app.CONFIG.SECURITY_KEYS.JWT_SECRET,
        { expiresIn: '1h' } 
    );
    await setCacheValue(userdata.username+"_token", token, CONFIG.REDIS.TOKEN_EXPIRY_IN_SECS)
    return token
}


const APIs = ["login", "logout", "signup", "public", "internal", "socket.io"]


async function validateAccessToken({ request }, reply, app) {
    try {
        const { url } = request.raw;
        const index = APIs.findIndex(e => url.includes(e));
        if (index === -1) {
            if (request.headers && !request.headers['authorization']) {
                return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
            } else {
                if (request.headers['authorization'].includes("Bearer")) {
                    const token = request.headers['authorization'].split(" ")[1];
                    try {
                        if (!token || token === '') {
                            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                        }
                        const decoded = jwt.verify(token, app.CONFIG.SECURITY_KEYS.JWT_SECRET);
                        request.token = token
                        request.user_info = decoded
                        if (!decoded || Object.keys(decoded).length === 0) {
                            return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                        }
                        // const chached_token = await getCacheValue(decoded.username + "_token")
                        // if (chached_token !== token) {
                        //     return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                        // }

                    } catch (error) {
                        throw error;
                    }
                } else {
                    return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                }
            }
        } else {
            // updateHeaders(request.headers, {});
            // console.log("this api doesn't require token")
        }
    } catch (error) {
        return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
    }
};


module.exports = { genereateToke, validateAccessToken }