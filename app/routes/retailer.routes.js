/**
 * Created by priyav on 19/08/15.
 */
var retailer_controller = require('../../app/controllers/retailer.controller'),
    middleware = require('../../app/controllers/middleware'),
    json_parser = require('body-parser').json(),
    digest_authentication = require('../passport').digest_authentication('retailer');



module.exports.routes = function(app) {
    app.post('/v1/retailer', json_parser, retailer_controller.save_retailer);
    app.get('/v1/retailer', digest_authentication, function(req, res) {
        res.json(req.user);
    });
    app.post('/v1/retailer/payment_request', digest_authentication, json_parser, retailer_controller.submit_request);
    app.get('/v1/retailer/payment_request/:id', digest_authentication, json_parser, retailer_controller.get_payment_request);
    app.get('/v1/retailer/payment_request', digest_authentication, json_parser, retailer_controller.get_payment_requests);
};