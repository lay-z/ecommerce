/**
 * Created by priyav on 07/08/15.
 */
var paypal_sdk = require('paypal-rest-sdk'),
    config = require("../../config/config"),
    request = require("request");
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




var verify_email = function(email, callback) {
    var paypal = config.paypal_classic;
    var request_obj = {
        url: "https://svcs.sandbox.paypal.com/AdaptiveAccounts/GetVerifiedStatus",
        headers: {
            "X-PAYPAL-SECURITY-USERID":paypal.USER_ID,
            "X-PAYPAL-SECURITY-PASSWORD": paypal.USER_PASSWORD,
            "X-PAYPAL-SECURITY-SIGNATURE": paypal.SECURITY_SIGNATURE,
            "X-PAYPAL-APPLICATION-ID": paypal.APP_ID,
            "X-PAYPAL-REQUEST-DATA-FORMAT": "NV",
            "X-PAYPAL-RESPONSE-DATA-FORMAT": "JSON",
            "Content-Type": "x-www-form-urlencoded"
        },
        form: {
            emailAddress: email,
            matchCriteria: "NONE",
            requestEnvelope: {
                errorLanguage:  "en_US"
            }
        }
    }

    // Create and send of the request
    request.post(request_obj, function(err, response) {
        console.log(response.headers)
        console.log(response.body)
    })
};

verify_email("priyav-bank@gmail.com", null);



