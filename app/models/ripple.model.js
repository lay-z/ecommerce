/**
 * Created by priyav on 19/07/15.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    request = require('request'),
    rippleREST = 'http://localhost:5990';


var Ripple_Account_Schema = new Schema({
    address: {
        type: String,
        trim: true
    },
    secret: {
        type: String,
        trim: true
    }
})

//Passes in  JSON obj with Ripple balance information of accountNo Into callback
// callback(err, body)
Ripple_Account_Schema.methods.getBalances = function (callback) {
    var RESTmethod_getBalance = '/v1/accounts/' + this.address + '/balances'
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
}


// Submits ripple_submit_object to ripple network
// rippleObj = {accountTo: "ripple_account_no", amount: decimal/number, currency: "KSH" (three letter country code)}
Ripple_Account_Schema.methods.submit_transaction = function(payObj, callback) {
    // Check if payObj has necessary field being passed in.
    if(!validate_payoptions(payObj))
        callback(new Error("Pay object passed in without all necessary fields"));

    var RESTmethod_submitPayment = '/v1/accounts/' + this.address + '/payments?validated=true';
    var urlSubmit = rippleREST + RESTmethod_submitPayment

    this.create_payment_object(payObj, function(err, submit_obj) {
        if(err) return callback(err);
        request.post({
            url: urlSubmit,
            json: true,
            body: submit_obj
        }, function(err, head, body) {
            if(err) return callback(new Error("Couldn't submit payment to ripple network"));
            return callback(null, body)
        })
    })
};

// Creates an object ready for RESTful submit
// callback(err, payment_obj)
// options = {payee: String (Ripple address), currency: String (3 letter ISO code),
//                  amount: String/Float/Int, [issuer: String (Ripple address of gateway) <optional>]}
Ripple_Account_Schema.methods.create_payment_object= function(options, callback) {
    // Validate payment object
    if(!validate_payoptions(options))
        return callback(new Error("create_payment_object called without all required fields"));

    var issuer = "";
    if(options.issuer) issuer = options.issuer;

    var payment = {
        "secret": this.secret,
        "payment": {
            "source_address": this.address,
            //"source_tag": ""
            "source_amount": {
                "value": options.amount.toString(),
                "currency": options.currency,
                "issuer": issuer
            },
            "source_slippage": "0",
            "destination_address": options.payee,
            "destination_tag": "",
            "destination_amount": {
                "value": options.amount.toString(),
                "currency": options.currency,
                "issuer": issuer
            },
            "invoice_id": "",
            "paths": "[]", //TODO work out if path necessary when transfering value between accounts
            "flag_no_direct_ripple": false,
            "flag_partial_payment": false
        }
    };

    var RESTmethod_genUUID = 'https://api.ripple.com/v1/uuid';

    request.get(RESTmethod_genUUID, function(err, header, body) {
        if(err)  return callback(new Error("couldn't generate UUID"));
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
var validate_payoptions = function(options) {
    if (typeof (options['payee'] && options["amount"] && options["currency"]) === 'undefined')
        return false;
    // If issuer exists, currency must be XRP
    if(typeof options["issuer"] === 'undefined') {
        return (options["currency"] === "XRP");
    }
    return true;
};


/* Sends out trust line between ripple account and the ripple account provided
*  trustObj is what is submitted to rippleREST server. Construct it using
*  create_trust_object
*/
Ripple_Account_Schema.methods.extendTrust = function (trustObj, callback) {
    var RESTmethod_extendTrust = '/v1/accounts/' + this.address + '/trustlines?validated=true';
    var urlTrust = rippleREST + RESTmethod_extendTrust;
    var requestObj = {
        json: true,
        url: urlTrust,
        body: trust
    };
    request.post(requestObj, function (error, head, body) {
        if (error)
            return callback(error);
        return callback(null, body)
    })
};

// Constructs trust object with necessay fields that can be sent off to rest server
// options = {limit: String, currency: String (3 letter iso eg KSH), counterparty:
// Returns null if any element of options doesn't exist
Ripple_Account_Schema.methods.create_trust_object = function(options) {
    if (options['limit'] && options["currency"] && options["counterparty"]) {
        return {
            "secret": this.secret,
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


Ripple_Account_Schema.statics.generate_wallet = function(callback) {
    var RESTmethod_generateWallet = rippleREST + "/v1/wallet/new";
    request.get(RESTmethod_generateWallet, function(err, head, body) {
        if (err) return callback(new Error("Couldn't generate Ripple Wallet"));

        callback(null, JSON.parse(body)['wallet']);
    })
};

/*
* Works out if account is valid account
* (by sending it a tiny incy wincy bit of money)
* TODO
*/
Ripple_Account_Schema.statics.validate_account = function(callback) {

}

mongoose.model('Ripple_Account', Ripple_Account_Schema);
