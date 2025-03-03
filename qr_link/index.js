
const { GET_USERS } = require('./controllers/qr_controller')
const { qr_schema } = require('./schemas/qr_schema')




module.exports = async (app) => {
    app.route({ method: 'POST', url: '/get/login/code', schema: qr_schema, handler: GET_USERS });
}