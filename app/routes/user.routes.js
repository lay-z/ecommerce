var authentication_type;
process.env.NODE_ENV === 'test' ? authentication_type = 'user-test' : authentication_type = 'user'

var controller = require('../../app/controllers/user.controller'),
    middleware = require('../../app/controllers/middleware'),
    json_parser = require('body-parser').json(),
    digest_authentication = require('../passport').digest_authentication(authentication_type);

module.exports.routes = function(app) {
    app.post('/v1/*', middleware.checkJSON);
    app.post('/v1/user/createUser',  json_parser, controller.save_user);
    app.get('/v1/user', digest_authentication, controller.get_ripple_account_information);
    app.get('/v1/user/payment_request', digest_authentication, controller.get_payment_requests);
    app.post('/v1/user/devices', json_parser, controller.log_device);
    app.post('/v1/user/devices/logout', digest_authentication, controller.log_out_device);
};
