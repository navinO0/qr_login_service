
const jwt = require('jsonwebtoken');




// Secret key for JWT (in a real-world application, store this in an environment variable)
const JWT_SECRET = process.env.JWT_SECRET;


const genereateToke = (app, userdata) => {

    // Generate a JWT token
    const token = jwt.sign(
        userdata,
        JWT_SECRET,
        { expiresIn: '1h' } 
    );

    return token
}

const validateToken = (token) => {
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded
    } catch (err) {
        return { status: 401, message: 'token validateion failed' }
    }
}


const APIs = ["login", "logout", "signup", "public", "internal"]


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

                    } catch (error) {
                        throw error;
                    }
                } else {
                    return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
                }
            }
        } else {
            // updateHeaders(request.headers, {});
            console.log("this api doesn't require token")
        }
    } catch (error) {
        return reply.code(401).send({ code: 401, type: 'error', "message": "Authorization required" });
    }
};




// async function validateTokenResponse(app, tokenKey, tokenDetails, token) {
//     try {
//         if (tokenDetails.token_type === 'EXPIRY_VALIDATE' && (Number(tokenDetails.token_expiry_time) > Number(new Date().getTime()))) {
//             return token;
//         } else if (app.config?.INSTANCE?.TOKEN_WITH_REDIS) {
//             return await QPF_getCachingValue(app, tokenKey);
//         } else if (Number(tokenDetails.token_expiry_time) > Number(new Date().getTime())) {
//             return token;
//         }
//     } catch (error) {
//         throw QPerrorParser(error);
//     }

// }

module.exports = { genereateToke, validateAccessToken }