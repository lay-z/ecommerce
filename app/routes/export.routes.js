/**
 * Created by priyav on 04/08/15.
 */
    // Initialises all routes for app
var fs = require('fs'),
    routes = ['payment.routes', 'user.routes'];

module.exports.routes = function(app) {
    for(var i =0; i < routes.length; i++) {
        require('./' + routes[i]).routes(app)
    }
};


