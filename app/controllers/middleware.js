/**
 * Created by priyav on 04/08/15.
 */
var mongoose = require('mongoose');
    User = mongoose.model('User');
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

// Middleware to validate user
module.exports.validate_user = function(req, res, next) {
    var phone_number = req.params.email;

    //check that email exists
    if(typeof phone_number === 'undefined') {
        return res.status(400).json({
            message:"No email address was provided",
            success: false
        })
    };

    User.findOne({phone_number: phone_number}, function(err, user) {
        // Check if payer is a valid user of the system
        if (err) return res.status(400).json(err);
        if (!user) return res.status(400).json({
            success: false,
            message: "Invalid phone_number; phone_number has not been registered"
        });

        // User exists and has been validated, adding to the requests
        req.user = user;
        next();
    });
};

module.exports.decrypt_secret = function (req, res, next) {
    // Assumes that the user has been authenticated (through passport)
    // function decrypts ripple_secret based on pin passed in
    if(!req.body.pin) {
        return res.status(400).json({
            success: false,
            message: "pin was not sent in body"
        })
    }

    if(!req.user.decryptSecret(req.body.pin)) {
        return res.status(400).json({
            success: false,
            message: "incorrect pin entered"
        })
    }

    // If pin was succesfull
    next();
}