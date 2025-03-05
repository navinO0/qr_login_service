
const { GET_USERS, CREATE_USER, LOGIN, GET_CODE, LOGIN_WITH_CODE } = require('./controllers/qr_controller')
const { qr_schema, user_create_schema, user_login_schema, lgin_code_schema, login_with_code } = require('./schemas/qr_schema')




module.exports = async (app) => {
    app.route({ method: 'POST', url: '/public/create/user', schema: user_create_schema, handler: CREATE_USER });
    app.route({ method: 'POST', url: '/public/login/user', schema: user_login_schema, handler: LOGIN });
    app.route({ method: 'POST', url: '/get/code', schema: lgin_code_schema, handler: GET_CODE });
    app.route({ method: 'POST', url: '/login/code/:code', schema: login_with_code, handler: LOGIN_WITH_CODE });
}