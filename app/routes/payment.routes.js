/**
 * Created by priyav on 04/08/15.
 */
var payment_methods = require('../../app/controllers/payment_methods'),
    middleware = require('../../app/controllers/middleware'),
    json_parser = require('body-parser').json(),
    digest_authentication = require('../passport').digest_authentication('user-basic');

module.exports.routes = function(app) {
    app.post("/v1/user/transfer", digest_authentication, json_parser,
                            middleware.decrypt_secret, payment_methods.pay_user);
    app.post("/v1/user/deposit/:email", middleware.validate_user, json_parser,
                            middleware.decrypt_secret, payment_methods.deposit);
    app.post("/v1/user/payment_request/:request", digest_authentication,
                            json_parser, middleware.decrypt_secret, payment_methods.payout_request)
    app.get("/v1/user/transactions", digest_authentication, json_parser,
                                                    payment_methods.retrieve_transactions);
};