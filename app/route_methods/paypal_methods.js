/**
 * Created by priyav on 07/08/15.
 */
var paypal_sdk = require('paypal-rest-sdk'),
    config = require("../../config/config"),
    request = require("request")
paypal_sdk.configure({
    'host': 'api.sandbox.paypal.com',
    'client_id': config.paypal.id,
    'client_secret': config.paypal.secret});




function payout_item(value, paypal_address) {
    return {
        "items": [{
            recipient_type: "EMAIL",
            amount: {
                currency: "USD",
                value: value.toString()
            },
            note: "Transfer funds worth:" + value + "into paypal account",
            receiver: paypal_address,
            sender_item_id: Math.random() // Perhaps this should be the same as the ripple txn number that sent the money to our gateway?
        }]
    }
}

var payout_paypal = function(payout, callback) {
    var sync = 'true';
    paypal_sdk.payout.create(payout_item(payout.amount, payout.paypal_account), sync, function(err, payment) {
        if (err) {
            console.log(err.response);
            throw err;
        }
        else {
            // If payment doesn't go through
            if(payment.batch_header.batch_status === "DENIED") {
                console.log("payment was not successfull");
            }
            console.log(JSON.stringify(payment, null, 4));
        }
    });
};

payout_paypal({
    amount: 20,
    paypal_account: "priyavrocks@gmail.com"
})




