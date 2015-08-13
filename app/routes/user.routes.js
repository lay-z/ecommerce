var user_methods = require('../../app/controllers/user_methods'),
    middleware = require('../../app/controllers/middleware'),
    json_parser = require('body-parser').json();

module.exports.routes = function(app) {
    app.post('/v1/user/*', middleware.checkJSON);
    app.post('/v1/user/createUser',  json_parser, user_methods.save_user);
    app.get('/v1/user/:email', middleware.validate_user, user_methods.get_ripple_account_information);
};
