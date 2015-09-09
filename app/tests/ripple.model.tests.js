/**
 * Created by priyav on 25/07/15.
 */

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
            customer.extend_trust(bank.address, function(err, body){
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
            receiver.extend_trust(master_account.address, function(err, body) {
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

    describe("previous_transactions", function() {
        this.timeout(14000);
        // local transaction account
        var transaction_account;
        var bank;

        var mock_transactions = {
            "payments": [
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "XRP",
                            "value": "200",
                            "issuer": ""
                        },
                        "source_slippage": "0",
                        "destination_account": "rNtXSoVpK58iqjFDa2hnQdrdmEh3tyNtFS",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "XRP",
                            "value": "200",
                            "issuer": ""
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-08T20:14:50.000Z",
                        "fee": "0.000012",
                        "result": "tesSUCCESS",
                        "balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-200.000012",
                                "issuer": ""
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-200.000012",
                                "issuer": ""
                            }
                        ],
                        "destination_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "200",
                                "issuer": ""
                            }
                        ],
                        "order_changes": []
                    },
                    "client_resource_id": "d7de4267-db9e-4132-87d5-ad06e1b9b913",
                    "hash": "A1EF9966E1A12F67C4F18702518DE3C74036544F55564A190CF37439CA881B24",
                    "ledger": "464",
                    "state": "validated"
                },
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "KSH",
                            "value": "10000",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "source_slippage": "0",
                        "destination_account": "rNtXSoVpK58iqjFDa2hnQdrdmEh3tyNtFS",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "KSH",
                            "value": "10000",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-08T20:15:10.000Z",
                        "fee": "0.000012",
                        "result": "tesSUCCESS",
                        "balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            },
                            {
                                "currency": "KSH",
                                "value": "-10000",
                                "issuer": "rNtXSoVpK58iqjFDa2hnQdrdmEh3tyNtFS"
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            },
                            {
                                "currency": "KSH",
                                "value": "-10000",
                                "issuer": "rNtXSoVpK58iqjFDa2hnQdrdmEh3tyNtFS"
                            }
                        ],
                        "destination_balance_changes": [
                            {
                                "currency": "KSH",
                                "value": "10000",
                                "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                            }
                        ],
                        "order_changes": []
                    },
                    "client_resource_id": "a2216d94-32b0-47c8-89a3-a0f1f0847b7d",
                    "hash": "AEFE0C6795DDA309D7BFD4369FDDBA8293EB95B16C7843C8305B29FFA08C1C44",
                    "ledger": "467",
                    "state": "validated"
                },
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "KSH",
                            "value": "10000",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "source_slippage": "0",
                        "destination_account": "rNtXSoVpK58iqjFDa2hnQdrdmEh3tyNtFS",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "KSH",
                            "value": "10000",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-08T20:32:20.000Z",
                        "fee": "0.000012",
                        "result": "tecPATH_DRY",
                        "balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            }
                        ],
                        "destination_balance_changes": [],
                        "order_changes": []
                    },
                    "client_resource_id": "a0da4b88-8352-4050-9afa-4f28f5b1256f",
                    "hash": "FE62D50356813CF571B9B4ABBDF7A0036693928A016B35D5ADE539EE9D223702",
                    "ledger": "673",
                    "state": "validated"
                },
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "KSH",
                            "value": "100",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "source_slippage": "0",
                        "destination_account": "rNtXSoVpK58iqjFDa2hnQdrdmEh3tyNtFS",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "KSH",
                            "value": "100",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-08T20:32:30.000Z",
                        "fee": "0.000012",
                        "result": "tecPATH_DRY",
                        "balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            }
                        ],
                        "destination_balance_changes": [],
                        "order_changes": []
                    },
                    "client_resource_id": "e476f766-cc83-4c2e-b159-33784c223195",
                    "hash": "868EEFC935927FD708B06F16EF0F24363FE5410C6B9638B3D404F1B2ED87BD6A",
                    "ledger": "675",
                    "state": "validated"
                },
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "XRP",
                            "value": "250",
                            "issuer": ""
                        },
                        "source_slippage": "0",
                        "destination_account": "rQGNsXG8X6fG1S998BJVJJEitGh58DBdMJ",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "XRP",
                            "value": "250",
                            "issuer": ""
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-08T23:18:40.000Z",
                        "fee": "0.000012",
                        "result": "tesSUCCESS",
                        "balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-250.000012",
                                "issuer": ""
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-250.000012",
                                "issuer": ""
                            }
                        ],
                        "destination_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "250",
                                "issuer": ""
                            }
                        ],
                        "order_changes": []
                    },
                    "client_resource_id": "41f029aa-559f-4269-a4f1-41d3b113454c",
                    "hash": "260FD9BA61BC30F805736CD9591D2F8A23EC47A1E2E6E181F86C65C123E14DBE",
                    "ledger": "2427",
                    "state": "validated"
                },
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "KSH",
                            "value": "100",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "source_slippage": "0",
                        "destination_account": "rQGNsXG8X6fG1S998BJVJJEitGh58DBdMJ",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "KSH",
                            "value": "100",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-08T23:18:50.000Z",
                        "fee": "0.000012",
                        "result": "tesSUCCESS",
                        "balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            },
                            {
                                "currency": "KSH",
                                "value": "-100",
                                "issuer": "rQGNsXG8X6fG1S998BJVJJEitGh58DBdMJ"
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            },
                            {
                                "currency": "KSH",
                                "value": "-100",
                                "issuer": "rQGNsXG8X6fG1S998BJVJJEitGh58DBdMJ"
                            }
                        ],
                        "destination_balance_changes": [
                            {
                                "currency": "KSH",
                                "value": "100",
                                "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                            }
                        ],
                        "order_changes": []
                    },
                    "client_resource_id": "75ffd2aa-4d6a-46b0-a18d-8faaa524e1c4",
                    "hash": "5FEEBF91A63CB73E729BDC97D11F9CC8A4E995B5794EAF2FB03428C3B2EA7661",
                    "ledger": "2429",
                    "state": "validated"
                },
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "XRP",
                            "value": "250",
                            "issuer": ""
                        },
                        "source_slippage": "0",
                        "destination_account": "ri4RSYbUPCWKFnagyGkgsSUj6SnAM763J",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "XRP",
                            "value": "250",
                            "issuer": ""
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-08T23:20:50.000Z",
                        "fee": "0.000012",
                        "result": "tesSUCCESS",
                        "balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-250.000012",
                                "issuer": ""
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-250.000012",
                                "issuer": ""
                            }
                        ],
                        "destination_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "250",
                                "issuer": ""
                            }
                        ],
                        "order_changes": []
                    },
                    "client_resource_id": "e8f2311f-1c2c-4a8d-8d98-5d3fab286242",
                    "hash": "43FE86F7898E946D4CC17D8ADDF8CDC6CB6DC402CFB6311492BC5E150776CC34",
                    "ledger": "2452",
                    "state": "validated"
                },
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "KSH",
                            "value": "100",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "source_slippage": "0",
                        "destination_account": "ri4RSYbUPCWKFnagyGkgsSUj6SnAM763J",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "KSH",
                            "value": "100",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-08T23:21:00.000Z",
                        "fee": "0.000012",
                        "result": "tesSUCCESS",
                        "balance_changes": [
                            {
                                "currency": "KSH",
                                "value": "-100",
                                "issuer": "ri4RSYbUPCWKFnagyGkgsSUj6SnAM763J"
                            },
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "KSH",
                                "value": "-100",
                                "issuer": "ri4RSYbUPCWKFnagyGkgsSUj6SnAM763J"
                            },
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            }
                        ],
                        "destination_balance_changes": [
                            {
                                "currency": "KSH",
                                "value": "100",
                                "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                            }
                        ],
                        "order_changes": []
                    },
                    "client_resource_id": "0d740b98-4680-4cf4-92da-a9d9d8bd8f3b",
                    "hash": "A26299A39DF5707446069085E0FF0445DA3C3292060D6A7BA01C497E9EDCC241",
                    "ledger": "2454",
                    "state": "validated"
                },
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "XRP",
                            "value": "250",
                            "issuer": ""
                        },
                        "source_slippage": "0",
                        "destination_account": "rEsA7nKwEwfph5FN5m8gZLqGNULuiUBmYz",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "XRP",
                            "value": "250",
                            "issuer": ""
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-08T23:21:30.000Z",
                        "fee": "0.000012",
                        "result": "tesSUCCESS",
                        "balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-250.000012",
                                "issuer": ""
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-250.000012",
                                "issuer": ""
                            }
                        ],
                        "destination_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "250",
                                "issuer": ""
                            }
                        ],
                        "order_changes": []
                    },
                    "client_resource_id": "67900c7d-3cb1-4050-b7de-340b157f2056",
                    "hash": "3A4D3E99CC2EBDE7F77A9D8F59D58C8089F984E933CA43BD7465C668BF2B3B29",
                    "ledger": "2460",
                    "state": "validated"
                },
                {
                    "payment": {
                        "source_account": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
                        "source_tag": "",
                        "source_amount": {
                            "currency": "KSH",
                            "value": "100",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "source_slippage": "0",
                        "destination_account": "rEsA7nKwEwfph5FN5m8gZLqGNULuiUBmYz",
                        "destination_tag": "",
                        "destination_amount": {
                            "currency": "KSH",
                            "value": "100",
                            "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                        },
                        "invoice_id": "",
                        "paths": "[]",
                        "no_direct_ripple": false,
                        "partial_payment": false,
                        "direction": "outgoing",
                        "timestamp": "2015-09-09T10:00:00.000Z",
                        "fee": "0.000012",
                        "result": "tesSUCCESS",
                        "balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            },
                            {
                                "currency": "KSH",
                                "value": "-100",
                                "issuer": "rEsA7nKwEwfph5FN5m8gZLqGNULuiUBmYz"
                            }
                        ],
                        "source_balance_changes": [
                            {
                                "currency": "XRP",
                                "value": "-0.000012",
                                "issuer": ""
                            },
                            {
                                "currency": "KSH",
                                "value": "-100",
                                "issuer": "rEsA7nKwEwfph5FN5m8gZLqGNULuiUBmYz"
                            }
                        ],
                        "destination_balance_changes": [
                            {
                                "currency": "KSH",
                                "value": "100",
                                "issuer": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                            }
                        ],
                        "order_changes": []
                    },
                    "client_resource_id": "32ee82cc-35b3-42fc-9a97-06f5dce2ef66",
                    "hash": "3391D66F9CC444509451C027795217C3460B2DC82306C833C064AA9E8CFEB27E",
                    "ledger": "2474",
                    "state": "validated"
                }
            ],
            "success": true
        }

        before(function(done) {
            // Generate a new ripple_account
            Ripple_Account.generate_wallet(function(err, wallet) {
                transaction_account = new Ripple_Account(wallet);
                bank = new Ripple_Account(Bank);
                bank.send_payment({
                    currency: "XRP",
                    amount: "250",
                    payee: transaction_account.address
                }, function(err, response) {
                    if (err) return done(err);
                    // Extend trust from account to bank
                    transaction_account.extend_trust(bank.address, done);
                });
            })
        });

        /*it("Should return an empty array for a validated account that doesn't have any KSH transactions", function(done) {
            transaction_account.previous_transactions(function(err, response) {
                if (err) return done(err);
                console.log(response);
                done();
            })
        })

        it("Should return some values for validated account that has been sent KSH", function(done) {
            // When
            bank.send_payment({
                currency: "KSH",
                amount: "100",
                payee: transaction_account.address,
                issuer: bank.address
            }, function(err, response) {
                if (err) return done(err);

                //Then
                transaction_account.previous_transactions(function(err, response) {
                    console.log(response);
                    done();
                })
            })
        })*/
        describe.only("process_previous_payments", function() {
            it("Should format payments right", function(){
                console.log(Ripple_Account.process_prev_payments(mock_transactions.payments));
            })
        })
    })
});