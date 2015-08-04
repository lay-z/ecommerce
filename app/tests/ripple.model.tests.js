/**
 * Created by priyav on 25/07/15.
 */

// Get environment into testing mode!
process.env.NODE_ENV = 'test';

var should = require('chai').should(),
    mongoose = require('mongoose'),
    Ripple_Account = mongoose.model('Ripple_Account'),
    assert = require('assert'),
    async = require('async');



describe("Ripple_Account Tests", function() {
    /* Global Objects for testing */
    var Bank = {
        address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb"
    };
    var Customer = {
        address: "rwy8vJNsfFW8SLguKB9YcPBsRbtvnhiMv4",
        secret: "sa3FxSh1xH7kLz79Gg9PpebTPaVvL"
    };

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

    describe("Generate wallet", function() {
        it("Should be able to generate static wallets", function(done) {
            Ripple_Account.generate_wallet(function(err, wallet) {
                should.not.exist(err);

                wallet.should.have.deep.property("address");
                wallet.should.have.deep.property("secret");
                done();
            })
        })
    });
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
            };

            var trustObj = account.create_trust_object(incorrectOptions);
            should.not.exist(trustObj);
        })
    });

    describe("submitting trust to ripple network", function() {
        this.timeout(5000);

        var bank = new Ripple_Account(Bank);
        var customer;

        before(function(done) {

            // Generate wallet and send enough money to validate account
            async.waterfall([
                Ripple_Account.generate_wallet,
                // Send money to wallet
                function (wallet, callback) {
                    customer = new Ripple_Account(wallet);
                    var options = {
                        payee: customer.address,
                        amount: "250",
                        currency: "XRP"
                    };
                    bank.send_payment(options, callback);
                },
                function(body, callback){
                    if(!body.success) return callback(new Error("payment not correctly sent"));
                    callback(null, body, 'done')
                }], function(err, response) {
                if (err) throw err;
                response.success.should.be.ok;
                done();
            });
        });

        it("Should be able to create trust line between bank and ripple account with enough XRP", function(done) {
            this.timeout(10000)
            customer.extendTrust(bank.address, function(err, body){
                should.not.exist(err);
                body.success.should.be.ok;
                body.should.have.deep.property("trustline.counterparty", bank.address);
                body.should.have.deep.property("trustline.limit", "10000");
                done();
            });

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
                    "source_account": account.address,
                    //"source_tag": ""
                    "source_amount": {
                        "value": "20",
                        "currency": "KSH",
                        "issuer": Bank.address
                    },
                    "source_slippage": "0",
                    "destination_account": Bank.address,
                    "destination_tag": "",
                    "destination_amount": {
                        "value": "20",
                        "currency": "KSH",
                        "issuer": Bank.address
                    },
                    "invoice_id": "",
                    "paths": [],
                    "flag_no_direct_ripple": false,
                    "flag_partial_payment": false
                }
            };
        });

        it("Should produce valid payment object if options are correct", function(done) {

            account.create_payment_object(correctOptions, function(err, payment_object){
                if(err) throw err;
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

        it("Should return error if currency is XRP and there is a issuer", function(done){
            incorrectOptions = {
                currency: "XRP",
                payee: correctOptions.payee,
                issuer: correctOptions.issuer,
                amount: "20"
            };
            account.create_payment_object(incorrectOptions, function(err, payObj) {
                should.exist(err);
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

    describe("Payments", function() {
        var master_account = new Ripple_Account({
            address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb"
        });
        var receiver;

        // Occurs before all test
        before(function(done) {
            // Generate receiver account to get money sent to
            Ripple_Account.generate_wallet(function(err, wallet) {
                if(err) throw err;

                receiver = new Ripple_Account(wallet);
                done();
            })
        });

        it("Should be able to send XRP to valid ripple account that doesn't have xrp", function(done) {
            this.timeout(6000);
            // Pay account from the master into new account
            options = {
                payee: receiver.address,
                currency: "XRP",
                amount: "250"
            };
            master_account.send_payment(options, function(err, response) {
                should.not.exist(err);
                response.success.should.be.ok;
                done();
            })
        });

        it("Should be able to send 100 KSH to an account that trusts the user", function(done) {
            this.timeout(12000);
            // send trust to receiver
            receiver.extendTrust(master_account.address, function(err, body) {
                if (err) throw err;
                var options = {
                    payee: receiver.address,
                    amount: 100,
                    currency: "KSH",
                    issuer: master_account.address
                };
                master_account.send_payment(options, function(err, response) {
                    should.not.exist(err);
                    response.success.should.be.ok
                    done();
                })
            });
        })
    })
});