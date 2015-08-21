/**
 * Created by priyav on 04/08/15.
 */
var payment_methods = require('../../app/controllers/payment_methods'),
    middleware = require('../../app/controllers/middleware'),
    json_parser = require('body-parser').json();

module.exports.routes = function(app) {
    app.post("/v1/user/:email/transfer", middleware.validate_user, json_parser,
                            middleware.decrypt_secret, payment_methods.pay_user);
    app.post("/v1/user/:email/validate", middleware.validate_user, json_parser,
                            middleware.decrypt_secret, payment_methods.validate_account);
    app.post("/v1/user/:email/deposit", middleware.validate_user, json_parser,
                            middleware.decrypt_secret, payment_methods.deposit);
    app.post("/v1/user/:email/payment_request/:request", middleware.validate_user,
                            json_parser, middleware.decrypt_secret, payment_methods.payout_request)
};