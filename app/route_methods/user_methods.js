var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account');


module.exports.save_user = function(req, res) {
    if (!req.body) return res.sendStatus(400);

    var save = function (account, wallet) {
        User.save_user_and_wallet(account, wallet, function (err) {
            if (err) return res.status(400).json(err);

            res.json({success: true});
        });
    }

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

// Middle ware to make sure data is raw JSON
module.exports.checkJSON = function(req, res, next) {
    if (req.get('Content-Type') !== 'application/json') {
        return res.status(400).json({
            success: false,
            error: {
                message:"Content type must be application/json"
            }
        });
    }
    next();
};

module.exports.get_ripple_account_information = function(req, res) {
    // Parse out email address from request URL
    var user_email = req.params.email;

    // get Mongoose user obj
    User.findOne({email: user_email}, function(err, user) {
        // If error, process and send back to user
        if (err) return res.status(400).json(err);

        if(user === null) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address; email address has not been registered"
            });
        }

        // Get users ripple account
       Ripple_Account.findById(user.ripple_account, function(err, account) {
           // If error, proess and send back to user
           if (err) return res.status(400).json(err);

           // Send request off for account balances
           account.getBalances(function(err, balance) {

               // if error, print to console and send back to user
               if (err) return res.status(500).json(err);

               // After receiving information process and send back nicely to request
               if(process_rippleBalances(balance)) {
                   return res.send(balance);
               };
               res.status(500).send(balance);
           })
       })
    });
};

// Process getBalance request and formats data into nice objects to be
// sent back. Returns true if getting balance was successful else returns false
// If returning balance was unsuccessful.
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
}

//TODO validation check for ripple rest running



