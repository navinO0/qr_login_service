'use strict'

const {runBasicQery} = require('../services/qr_service')


async function GET_USERS(request, reply) {
    const body = request.body
    const few = 'varuable'
    console.log(few)
    const response = await runBasicQery(this)
    reply.send(response).code(200)
}


async function CREATE_USER(request, reply) {
    
}



module.exports = { GET_USERS }