/**
 * Created by priyav on 27/07/15.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account'),
    assert = require('assert');

var BANK = {
    address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    secret: "snoPBrXtMeMyMHUVTgbuqAfg1SUTb"
}

function payment_options(payee, amount, no_currency) {
    var options = {
        amount: amount,
        payee: payee,
        currency: "XRP"
    }
    if (no_currency === "undefined") {
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

    User.findOne({email: req.body.payee}, function(err, payee) {
        if (err || (payee == null)) return res.status(400).json({
            success: false,
            message: "Payee is not registered on system"
        });
        var payment_options = (req.body.amount, user.ripple_account[0].address);

        user.ripple_account[0].send_payment(payment_options, function(err, response){
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

    if(user_account.validated) {
        return res.status(400).json({
            success: false,
            message: "User is already validated"
        })
    };

    // Send users wallet XRP
    bank.send_payment(payment_options(user_account.address, 250, true), function(err, response){
        if(err) return res.status(500).json(error_msg);

        // Extend trust from user to bank
        user_account.extend_trust(bank.address, function(err, response) {
            if(err) return res.status(500).json(error_msg);
            res.json({
                success: true,
                message: "Users account has now been validated"
            })
            user_account.validated = true;
            user.save(function(err) {
                if(err) {
                    console.log(err);
                }
            })
        })
    })
};