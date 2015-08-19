/**
 * Created by priyav on 13/08/15.
 */
var passport = require('passport'),
    Local_Strategy = require('passport-local').Strategy,
    mongoose = require('mongoose'),
    User = mongoose.model('User');

module.exports = function() {
    passport.use(new Local_Strategy({
        // inform password strategy that username and password are in different fields
        usernameField: 'email',
        passwordField: 'pin',
        },
        // local strategy requires credential parameters to exist in username and password
        function(username, password, done) {
            User.findOne({email: username}, function(err, user) {
                // Check if payer is a valid user of the system
                if(err) return done(err);
                if(!user) return done(null, false, {
                    success: false,
                    message: "Invalid email address; email address has not been registered"
                });

                if(!user.authenticate(password)) {
                    return done(null, false, {
                        success: false,
                        message: "Invalid pin"
                    })
                }

                return done(null, user)
            })
        }
    ))
}
