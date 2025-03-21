'use strict';



const { decryptObject, aesDecrypt } = require('../crypto')

const { AsyncLocalStorage } = require('async_hooks');
const context = new AsyncLocalStorage();
const R = require("ramda");

const KEY_HEX = process.env.KEY_HEX; // Same key as client
const IV_HEX = process.env.IV_HEX;  // Same IV as client




const checkIsEmpty = data => (R.isEmpty(data) ? undefined : data);

async function requestContext(req, _rep) {
    try {
        if (req && req.routeSchema && req.routeSchema.req_encrypted) {
            const encryptKeys = req.routeSchema.encrypted_properties || [];

            let body = checkIsEmpty(req.body);
            if (body) {
                req.body = decryptObject(body, encryptKeys, aesSecKey, aesSecIv);
            }
        }
        if (req && req.routeSchema && req.routeSchema.body_encrypted) {
            const aesSecKey = Buffer.from(KEY_HEX, "hex");
            const aesSecIv = Buffer.from(IV_HEX, "hex");
            let body = checkIsEmpty(req.body);
            if (body) {
                decryptObject(obj)
                const encryptedBody = aesDecrypt(aesSecKey, aesSecIv, JSON.stringify(body));
                if (encryptedBody && typeof encryptedBody === 'string') {
                    req.body = JSON.parse(encryptedBody) || {};
                }
            }
        }

    } catch (error) {
        console.log("err", error)
    }

}

module.exports = { requestContext };
