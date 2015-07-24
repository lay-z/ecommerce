var user_methods = require('../../app/route_methods/user_methods'),
    json_parser = require('body-parser').json();

module.exports.routes = function(app) {
    app.post('/createUser', json_parser, user_methods.save_user);
}
