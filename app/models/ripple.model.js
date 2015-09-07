/**
 * Created by priyav on 19/07/15.
 */
"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    request = require('request'),
    rippleREST = 'http://localhost:5990';

/**
* Global variables
 */
    var TRUST_LIMIT = 10000;


var Ripple_Account_Schema = new Schema({
    address: {
        type: String,
        trim: true
    },
    secret: {
        type: String,
        trim: true
    },
    validated: {
        type: Boolean,
        default:false
    }
});

//Passes in  JSON obj with Ripple balance information of accountNo Into callback
// callback(err, body)
Ripple_Account_Schema.methods.get_balances = function (callback) {
    var self = this;
    var RESTmethod_getBalance = '/v1/accounts/' + self.address + '/balances'
    var urlBalances = rippleREST + RESTmethod_getBalance;
    request(urlBalances, function(error, header, body) {
        if(error){
            return callback(error)
        }
        // Requests used for get and post requests with rippleREST
        else {
            callback(null, JSON.parse(body));
        }
    })
};

Ripple_Account_Schema.methods.send_payment = function(options, callback) {
/*
*  Waits till server validates transaction before making callback
*  options = {payee: String (Ripple address),
*       currency: String (3 letter ISO code),
*       amount: String/Float/Int,
*       [issuer: String (Ripple address of gateway) <optional>]
*  }
*  callback(err, response) where response is the body of response
*  from ripple-rest server
*/
    var self = this;

    // Create payment object
    self.create_payment_object(options, function(err, payment){
       if(err) return callback(err, payment);
        // Submit transaction
        var post_args = {
            url : '/v1/accounts/' + self.address + '/payments?validated=true',
            body: payment
        };
        submit(post_args, callback)
    });
};

var submit = function(post_args, callback) {
// Submits post requests to ripple-rest server
// post_args - contains url and body to be posted to server
// callback(err, response.body)

    request.post({
        url: rippleREST + post_args.url,
        json: true,
        body: post_args.body
    }, function(err, head, body) {
        if(err) throw err;

        var error = null;
        if(!body.success) {
            error = new Error("Submission failed. check body for error details")
        }
        callback(error, body)
    })
};

var get_url = function(url, callback) {
    url = rippleREST + url;
    request.get(url, function(err, head){
        if(err) callback(err);

        if(head.statusCode === 502) return callback(
            new Error("Ripple-rest couldn't connect to rippled")
        );

        callback(null, head.body);
    });
};

// Creates an object ready for RESTful submit
// callback(err, payment_obj)
// options = {payee: String (Ripple address), currency: String (3 letter ISO code),
//                  amount: String/Float/Int, [issuer: String (Ripple address of gateway) <optional>]}
Ripple_Account_Schema.methods.create_payment_object= function(options, callback) {
    // Validate payment object
    if(!validate_pay_options(options))
        return callback(new Error(), {
            message: "create_payment_object called without all required fields",
            success: false
        });

    var self = this;
    var issuer = "";
    if(options.issuer) issuer = options.issuer;
    //console.log(issuer)

    var payment = {
        "secret": self.secret,
        "payment": {
            "source_account": self.address,
            //"source_tag": ""
            "source_amount": {
                "value": options.amount.toString(),
                "currency": options.currency,
                "issuer": issuer
            },
            "source_slippage": "0",
            "destination_account": options.payee,
            "destination_tag": "",
            "destination_amount": {
                "value": options.amount.toString(),
                "currency": options.currency,
                "issuer": issuer
            },
            "invoice_id": "",
            "paths": [],
            "flag_no_direct_ripple": false,
            "flag_partial_payment": false
        }
    };

    get_url('/v1/uuid', function(err, body) {

        if(err) return callback(err);

        var uuid = JSON.parse(body)["uuid"];
        payment["client_resource_id"] = uuid;

        callback(null, payment);
    })

};

/*
* helper function for create_payment_object
* Validates options to make sure necessary fields exist
* Returns false if not
 */
var validate_pay_options = function(options) {
    if (typeof (options['payee'] && options["amount"] && options["currency"]) === 'undefined')
        return false;
    // If issuer exists, currency must be XRP and vice versa
    if((typeof options["issuer"] === 'undefined') !== (options["currency"] === "XRP")) {
        return false;
    }
    return true;
};


/* creates a trust of 10000 KSH between the ripple account and ripple_address
*  provided in the argument
*  trustObj is what is submitted to rippleREST server. Construct it using
*  create_trust_object
*/
Ripple_Account_Schema.methods.extend_trust = function (ripple_address, callback) {
    var self = this;
    var body, options;
    options = {
        limit: TRUST_LIMIT,
        counterparty: ripple_address,
        currency: "KSH"
    };
    //Create trust object
    body = self.create_trust_object(options);
    if(body) {
        options = {
            url: '/v1/accounts/' + self.address + '/trustlines?validated=true',
            body: body
        };
        submit(options, function(err, body) {
            callback(err, body)
        })
    }
};

// Constructs trust object with necessay fields that can be sent off to rest server
// options = {limit: String, currency: String (3 letter iso eg KSH), counterparty:
// Returns null if any element of options doesn't exist
Ripple_Account_Schema.methods.create_trust_object = function(options) {
    var self = this;
    if (options['limit'] && options["currency"] && options["counterparty"]) {
        return {
            "secret": self.secret,
            "trustline": {
                "limit": options.limit.toString(),
                "currency": options.currency,
                "counterparty": options.counterparty,
                "account_allows_rippling": false
            }
        };
    } else {
        return null;
    }
};

Ripple_Account_Schema.methods.previous_transactions = function(callback) {
    var self = this;
    // Returns array of previous transactions made by Ripple_account
    // Previous transactions are passed in as an argument to callback
    var url =  '/v1/accounts/'+this.address+'/payments'

    // make get request to Ripple_REST/v1/accounts/:id/payments
    get_url(url, function(err, body) {
        if(err) return callback(err, body);

        // Will need to format the response
        callback(null, body);
    })
}


Ripple_Account_Schema.statics.generate_wallet = function(callback) {
    get_url( "/v1/wallet/new", function(err, body) {
        if (err) return callback(new Error("Couldn't generate Ripple Wallet"));

        callback(null, JSON.parse(body)['wallet']);
    });
};


mongoose.model('Ripple_Account', Ripple_Account_Schema);
