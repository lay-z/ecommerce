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
        trim:true
    }
})

//Passes in  JSON obj with Ripple balance information of accountNo Into callback
// callback(err, body)
Ripple_Account_Schema.methods.getAccountBalances = function (callback) {
    var RESTmethod_getBalance = '/v1/accounts/' + this.account + '/balances'
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


var validate_payObj = function(obj) {
    return (obj['accountTo'] && obj["amount"] && obj["currency"])
}

// Submits ripple_submit_object to ripple network
// rippleObj = {accountTo: "ripple_account_no", amount: decimal/number, currency: "KSH" (three letter country code)}
Ripple_Account_Schema.methods.submit_transaction = function(payObj, callback) {
    // Check if payObj has necessary field being passed in.
    if(!validate_payObj(payObj))
        callback(new Error("Pay object passed in without all necessary fields"));

    var RESTmethod_submitPayment = '/v1/accounts/' + this.address + '/payments?validated=true';
    var urlSubmit = rippleREST + RESTmethod_submitPayment

    this.create_ripple_submit(payObj, function(err, submit_obj) {
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
Ripple_Account_Schema.methods.create_ripple_submit= function(payObj, callback) {
    var payment = {
        "secret": this.secret,
        "payment": {
            "source_address": this.address,
            //"source_tag": ""
            "source_amount": {
                "value": payObj.amount.toString(),
                "currency": payObj.currency,
                "issuer": ""// TODO need to place in hot wallet/cold wallet?
            },
            "source_slippage": "0",
            "destination_address": payObj.accountTo,
            "destination_tag": "",
            "destination_amount": {
                "value": payObj.amount.toString(),
                "currency": payObj.currency,
                "issuer": ""// TODO need to place in hot wallet/cold wallet?
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
        var uuid = JSON.parse(body)["uuid"]
        payment["client_resource_id"] = uuid

        callback(null, payment);
    })
};


// Module takes in TODO
Ripple_Account_Schema.methods.setTrust = function (trust, callback) {
    var RESTmethod_extendTrust = '/v1/accounts/' + this.address + '/trustlines?validated=true';
    var trustObj = {
        "secret": this.secret,
        "trustline": {
            "limit": trust.limit,
            "currency": trust.currency,
            "counterparty": trust.counterparty,
            "account_allows_rippling": false
        }
    };
    var urlTrust = rippleREST + RESTmethod_extendTrust;
    var requestObj = {
        json: true,
        url: urlTrust,
        body: trustObj
    };
    request.post(requestObj, function (error, head, body) {
        if (error)
            return callback(error);
        return callback(null, body)
    })
};

Ripple_Account_Schema.statics.generate_wallet = function(callback) {
    var RESTmethod_generateWallet = rippleREST + "/v1/wallet/new"
    request.get(RESTmethod_generateWallet, function(err, head, body) {
        if (err) return callback(new Error("Couldn't generate Ripple Wallet"));

        callback(null, JSON.parse(body)['wallet'])
    })
};

mongoose.model('Ripple_Account', Ripple_Account_Schema);
