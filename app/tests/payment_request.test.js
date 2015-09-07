/**
 * Created by priyav on 06/09/15.
 */

var mongoose = require('mongoose'),
    payment_request = mongoose.model('Payment_Request'),
    request_bin = 'http://requestb.in/uo7jvquo';

// Makes a request to request_bins address

describe("Payment requests", function() {

    describe("webhook_callback", function() {
        var payment_request_fields = {
            customer_number: "08869956",
            amount: {
                value: "200.00",
                currency: "KSH"
            },
            description: "test payment_request",
            retailer: null,
            business_name: "test_business",
            proof_of_payment: null,
            callback_url: request_bin
        };

        it("Should send webhook to callback_url with object passed as argument", function(done) {
            var payment_request_obj = payment_request(payment_request_fields);
            payment_request_obj.webhook_callback({test: "test"}, function(err, response) {
                if (err) return  done(err);
                console.log(response.body);
                done();
            })
        })
    })
})



