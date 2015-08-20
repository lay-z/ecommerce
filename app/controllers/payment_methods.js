/**
 * Created by priyav on 27/07/15.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account'),
    Payment_Request = mongoose.model('Payment_Request'),
    Retailer = mongoose.model('Retailer'),
    assert = require('assert'),
    BANK = require('../../config/config').bank;


function payment_options(payee, amount, no_currency) {
    var options = {
        amount: amount,
        payee: payee,
        currency: "XRP"
    }
    if (typeof no_currency === "undefined") {
        options.currency = "KSH"
        options.issuer = BANK.address;
    }
    return options;
}
module.exports.pay_user = function(req, res) {
    /*
    * Calls send payment
    * User should already be attached to request after user middleware
    * Values can only be in KSH
    * Both the payer and payee must trust the bank
    * Body should contain two members: payee and amount
     */
    var user = req.user;

    User.findOne({phone_number: req.body.payee}, function(err, payee) {
        if (err || (payee === null)) return res.status(400).json({
            success: false,
            message: "Payee is not registered on system"
        });
        var options = payment_options(payee.ripple_account[0].address, req.body.amount);

        user.ripple_account[0].send_payment(options, function(err, response){
            if(err) {
                return res.status(400).json(response);
            }
            res.json(response);
        });
    });
};


module.exports.validate_account = function(req, res) {
    // Sends XRP to user and creates a trustline between user and issuing wallet
    // Trustline is currently set at default of 10,000 KSH

    var error_msg = {
        success: false,
        message: "Something wrong happened at the server"
    };
    var user = req.user;
    var user_account = req.user.ripple_account[0];
    var bank = new Ripple_Account(BANK);

    if (user_account.validated) {
        return res.status(400).json({
            success: false,
            message: "User is already validated"
        })
    };

    // Send users wallet XRP
    bank.send_payment(payment_options(user_account.address, 250, true), function (err, response) {
        if (err) return res.status(500).json(error_msg);

        // Extend trust from user to bank
        user_account.extend_trust(bank.address, function (err, response) {
            if (err) return res.status(500).json(error_msg);
            res.json({
                success: true,
                message: "Users account has now been validated"
            })
            user_account.validated = true;
            user.save(function (err) {
                if (err) {
                    console.log(err);
                }
            })
        })
    })
};

module.exports.deposit = function(req, res) {
    var user = req.user;
    var user_acc = user.ripple_account[0];
    var amount = req.body.amount;
    var bank = new Ripple_Account(BANK);
    // Check amount exists
    if(typeof req.body.amount === "undefined") {
        return res.status(400).json({
            success: false,
            message: "Invalid parameters: amount"
        });
    }
    // if user is not validated
    if(!user_acc.validated) {
        return res.status(500).json({
            success: false,
            message: "User account has not yet been validated"
        });
    };
    bank.send_payment(payment_options(user_acc.address, amount), function(err, resp) {
        if(err) return res.status(500).json({
            success: false,
            message: "Could not deposit amount",
            ripple: resp
        });

        res.json({
            success: true,
            message: "successfully deposited " + amount + " KSH",
            ripple: resp
        })
    })
};

//TODO add webhook support for retailer?
module.exports.payout_request = function (req, res) {
    var user = req.user;
    // Find the request
    Payment_Request.findOne({_id: req.params.request}, function(err, request){
        if(err | !request) return res.status(400).json({success:false, message:"Invalid payment_request"})
        console.log(request)

        // If user wishes to decline save the request as declined and quit
        if(req.body.decline) {
            request.proof_of_payment = "DECLINED";
            request.save(function(err) {
                if(err) console.log("Couldn't save request");
            });
            return res.json({
                success: true,
                message: "Payment has been cancelled"
            })
        }

        // Check if it has been paid, or cancelled
        if(request.proof_of_payment) {
            return res.json({
                success: false,
                message: "Payment request has already been paid or has been cancelled"
            })
        }

        // Find the ripple account of the business asking for request
        Retailer.findOne({_id: request.retailer}, function(err, retailer) {
            if(err | !retailer) res.status(500).json({success: false, message: "Could not find retailer"})
            console.log(retailer);

            // send payment to ripple account
            options = {
                payee: retailer.ripple_address,
                currency: request.amount.currency,
                issuer: BANK.address,
                amount: request.amount.value
            };
            user.ripple_account[0].send_payment(options, function(err, body) {
                if(err | !body.success) return res.status(400).json({
                    success: false,
                    message: "Ripple payment failed",
                    details: body
                })
                console.log(body);
                // If payment validated then update request to have UUID placed onto payment
                request.proof_of_payment = body.hash;
                request.save(function(err) {
                    if (err) console.log("Error saving request:\n%s", request)
                });

                // Return confirmatory message if succesfull
                res.json({
                    success: true,
                    message: "Succesfully completed payment",
                    request: request
                })
            })
        })
    })
}