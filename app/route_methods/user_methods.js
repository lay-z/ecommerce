var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account'),
    assert = require('assert');


module.exports.save_user = function(req, res) {
    if (!req.body) return res.sendStatus(400);

    var save = function (account, wallet) {
        User.save_user_and_wallet(account, wallet, function (err) {
            if (err) return res.status(400).json(err);

            res.json({success: true});
        });
    };

    if(req.body.ripple_account && req.body.secret) {
        // Check if correct ripple_details have been sent/ exist (?)

        var wallet = {
            account: req.body.ripple_account,
            secret: req.body.secret
        };
        save(req.body, wallet);
    } else {
        Ripple_Account.generate_wallet(function(err, wallet) {
            save(req.body, wallet);
        });
    }
};



module.exports.get_ripple_account_information = function(req, res) {
    // Parse out email address from request URL
    var user = req.user;

   // Send request off for account balances
   user.ripple_account[0].getBalances(function(err, balance) {
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


module.exports.transfer = function(req, res) {
    // Search for user

};
//TODO validation check for ripple rest running



