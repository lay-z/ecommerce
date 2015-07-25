var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Ripple_Account = mongoose.model('Ripple_Account');


module.exports.save_user = function(req, res) {
    if (!req.body) return res.sendStatus(400);
    // Check if correct ripple_details have been sent/ exist (?)
    function save(account, wallet) {
        User.save_user_and_wallet(account, wallet, function (err) {
            if (err) return res.status(400).json(err);

            res.json({success: true})
        });
    }

    if(req.body.ripple_account && req.body.secret) {
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

//TODO validation check for ripple rest running



