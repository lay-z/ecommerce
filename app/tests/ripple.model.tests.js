/**
 * Created by priyav on 25/07/15.
 */

// Get environment into testing mode!
process.env.NODE_ENV = 'test';

var should = require('chai').should(),
    mongoose = require('mongoose'),
    Ripple_Account = mongoose.model('Ripple_Account');

/* Global Objects for testing */
var Bank = {
    address: "rJvLnRvyWEi1srDY3JA4GUsJd9MVvcYof5",
    secret: "snZ4ZNHuJhJAmpd6e532pUZggXJUm"
};
var Customer = {
    address: "rwy8vJNsfFW8SLguKB9YcPBsRbtvnhiMv4",
    secret: "sa3FxSh1xH7kLz79Gg9PpebTPaVvL"
};

describe("Ripple method Tests", function() {
    var account = new Ripple_Account(Customer);
    var correctTrustObj = {
        "secret": account.secret,
        "trustline": {
            "limit": "10",
            "currency": "KSH",
            "counterparty": Bank.address,
            "account_allows_rippling": false
        }
    };
    describe("create_trust_object", function() {
        it("Should be able to create valid trustObj", function() {

            var options = {
                counterparty: Bank.address,
                limit: 10,
                currency: "KSH"
            };

            var trustObj = account.create_trust_object(options);
            trustObj.should.deep.equal(correctTrustObj);
        });

        it("Should return null if any value is missing from options", function(){
            var incorrectOptions = {
                limit: "500",
                counterparty: "iu-98azjlkjoi90ojzirpo"
            }

            var trustObj = account.create_trust_object(incorrectOptions);
            should.not.exist(trustObj);
        })
    });

    describe("create_payments_obj", function(){

        var account = new Ripple_Account(Customer);
        var correctOptions;
        var correctPayObj;

        beforeEach(function() {
            correctOptions = {
                amount: 20,
                currency: "KSH",
                issuer: Bank.address,
                payee: Bank.address
            };
            correctPayObj = {
                "secret": account.secret,
                "payment": {
                    "source_address": account.address,
                    //"source_tag": ""
                    "source_amount": {
                        "value": "20",
                        "currency": "KSH",
                        "issuer": Bank.address
                    },
                    "source_slippage": "0",
                    "destination_address": Bank.address,
                    "destination_tag": "",
                    "destination_amount": {
                        "value": "20",
                        "currency": "KSH",
                        "issuer": Bank.address
                    },
                    "invoice_id": "",
                    "paths": "[]",
                    "flag_no_direct_ripple": false,
                    "flag_partial_payment": false
                }
            };
        });

        it("Should produce valid payment object if options are correct", function(done) {

            account.create_payment_object(correctOptions, function(err, payment_object){
                if(err) throw err
                delete payment_object.client_resource_id;
                payment_object.should.deep.equal(correctPayObj);
                done();
            })
        });

        it("Should produce payment object if issuer does not exist and currency is XRP", function(done) {
            // Get correctPayment object ready
            correctPayObj.payment.source_amount.issuer = "";
            correctPayObj.payment.source_amount.currency = "XRP";
            correctPayObj.payment.destination_amount.issuer = "";
            correctPayObj.payment.destination_amount.currency = "XRP";

            delete correctOptions.issuer;
            correctOptions.currency = "XRP"

            account.create_payment_object(correctOptions, function(err, payObj) {
                if(err) throw err;
                delete payObj.client_resource_id;
                payObj.should.deep.equal(correctPayObj);
                done();
            });
        });

        it("Should throw error when not all options exist", function(done) {
            incorrectOptions = {
                currency: "XRP",
                amount: "20.0"
            }
            account.create_payment_object(incorrectOptions, function(err, payObj){
                should.exist(err);
                done();
            })
        });

        it("Should throw error if issuer is NOT supplied and currency is NOT XRP", function(done){
            delete correctOptions.issuer;
            account.create_payment_object(correctOptions, function(err, payObj){
                should.exist(err);
                done();
            });
        })
    });

    //describe("Payments", function() {
        //it("Should be able to send XRP to valid ripple account", function() {
        //
        //})
    //})
});