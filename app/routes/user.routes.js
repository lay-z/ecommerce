var user_methods = require('../../app/route_methods/user_methods'),
    json_parser = require('body-parser').json();

module.exports.routes = function(app) {
    app.post('/v1/user/*', user_methods.checkJSON)
    app.post('/v1/user/createUser',  json_parser, user_methods.save_user);
}
