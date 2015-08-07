/**
 * Created by priyav on 07/08/15.
 */
var paypal_sdk = require('paypal-rest-sdk'),
    config = require("../../config/config");
paypal_sdk.configure({
    'host': 'api.sandbox.paypal.com',
    'client_id': config.paypal.id,
    'client_secret': config.paypal.secret});


