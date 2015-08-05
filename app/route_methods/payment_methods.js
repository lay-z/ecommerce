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
        var payment_options = {
            amount: req.body.amount,
            payee: payee.ripple_account[0].address,
            currency: "KSH",
            issuer: BANK.address
        };

        user.ripple_account[0].send_payment(payment_options, function(err, response){
            if(err) {
                return res.status(400).json(response);
            }
            res.json(response);
        });
    });
};