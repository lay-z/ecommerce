var controller = require('../../app/controllers/user.controller'),
    middleware = require('../../app/controllers/middleware'),
    json_parser = require('body-parser').json(),
    digest_authentication = require('../passport').digest_authentication(false);

module.exports.routes = function(app) {
    app.post('/v1/user/*', middleware.checkJSON);
    app.post('/v1/user/createUser',  json_parser, controller.save_user);
    //app.get('/v1/user/:email', digest_authentication, controller.get_ripple_account_information);
    app.get('/v1/user/payment_request', digest_authentication, controller.get_payment_requests)
    app.post('/v1/user/devices', json_parser, controller.log_device)
};
