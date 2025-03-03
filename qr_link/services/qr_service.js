'use strict'


const runBasicQery = async(app) => {
    const response = await app.knex.raw('select * from users limit 10');
    return response.rows
}

module.exports = {runBasicQery}