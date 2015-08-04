/**
 * Created by priyav on 27/07/15.
 */
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account'),
    assert = require('assert');


module.exports.pay_user = function(req, res) {
    /*
    * Calls send payment
    * User should already be attached to request after user middleware
     */
    var user = req.user;

    user.ripple_account.send_payment(req.body, function(err, response){
        if(!response.sucess) {
            return res.status(500).json(response);
        }
        res.json(response);
    });
};