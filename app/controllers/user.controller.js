var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account'),
    Payment_Request = mongoose.model('Payment_Request'),
    assert = require('assert');


module.exports.save_user = function(req, res) {
    if (!req.body) return res.sendStatus(400);

    Ripple_Account.generate_wallet(function(err, wallet) {
        User.save_user_and_wallet(req.body, wallet, function (err) {
            if (err) return res.status(400).json(err);

            res.json({success: true});
        });
    });
};



module.exports.get_ripple_account_information = function(req, res) {
    // Parse out email address from request URL
    var user = req.user;
    console.log(user);
   // Send request off for account balances
   user.ripple_account[0].get_balances(function(err, balance) {
       if (err) return res.status(500).json(err);

       // After receiving information process and send back nicely to request
       if(process_rippleBalances(balance)) {
           return res.send(balance);
       };
       res.status(500).send(balance);
   })
};

// Process getBalance request and formats data into nice objects to be
// sent back. Returns true if getting balance was successful else returns false
// If returning balance was unsuccessful
// Directly modifies balance object
var process_rippleBalances = function(balance) {
    if(!balance.success) {
        // Modify error object
        delete balance.error;
        delete balance.error_type;
        balance.message = "User Account has not yet been validated";

        return false;
    }
    var messages = balance.balances;
    for (var i = messages.length - 1; i >= 0; i--) {
        // Remove XRP information
        if (messages[i].currency === "XRP") {
            messages.splice(i, 1);
        } else {
            delete messages[i].counterparty;
        }
    }
    delete balance.ledger;
    delete balance.validated;

    return true;
};

module.exports.get_payment_requests = function(req, res) {
    var no_requests = {success:false, message: "No requests have been made yet"};

    // Returns array of all request objects that have been made by retailer
    var user = req.user;
    var query_opts = {customer_number: user.phone_number }

    // If query has been appended to url
    if(req.query) {
        // Return only paid requests
        if(req.query.paid === 'true') {
            query_opts.proof_of_payment = {$ne: null}
        }
        // Return only unpaid requests
        if(req.query.paid === 'false') {
            query_opts.proof_of_payment =  null;
        }
    }

    Payment_Request.find(query_opts , "-__v -retailer", function(err, requests) {
        if(err) return res.status(500).json(no_requests);

        res.json({
            success: true,
            requests: requests
        })
    })
};


