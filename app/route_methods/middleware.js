/**
 * Created by priyav on 04/08/15.
 */
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
    var user_email = req.params.email;

    //check that email exists
    if(typeof (user_email = req.params.email) == 'undefined') {
        return res.status(400).json({
            message:"No email address was provided",
            success: false
        })
    };

    User.findOne({email: user_email}, function(err, user) {
        // Check if payer is a valid user of the system
        if(user === null) return res.status.json({
            success: false,
            message: "Invalid email address; email address has not been registered"
        });
        // Assign mongoose user model to request and call next function
        req.user = user;
        next();
    })
};