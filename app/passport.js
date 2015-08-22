/**
 * Created by priyav on 13/08/15.
 */
var passport = require('passport'),
    Strategy = require('passport-http').DigestStrategy,
    Test_Strategy = require('passport-local')
    mongoose = require('mongoose'),
    Retailer = mongoose.model('Retailer'),
    User = mongoose.model('User');

module.exports.initialize = function() {
    // For authenticating retailers
    passport.use('retailer-digest', new Strategy( {qop: 'oauth'}, function(username, callback){
        Retailer.findOne({_id: username}, function(err, retailer) {
            // If retailer doesn't have id then return no matching _id
            if (err) return callback(err);
            if(!retailer) return callback(null, false);
            return callback(null, retailer, retailer.secret)
        })
    }));

    // For authenticating users
    passport.use('user-digest', new Strategy( {qop: 'oauth'}, function(username, callback){
        User.findOne({"device.id": username}, function(err, user) {
            // If retailer doesn't have id then return no matching _id
            if (err) return callback(err);
            if(!user) return callback(null, false);
            return callback(null, user, user.device.secret)
        })
    }));

    passport.use('user-test', new Strategy({
        usernameField: 'id',
        passwordField: 'secret',
        session: false
        },
        function (username, password, callback) {
            User.findOne({"device.id": username}, function(err, user) {
                // If retailer doesn't have id then return no matching _id
                if (err) return callback(err);
                if(!user) return callback(null, false);

                // Make sure secrets are equal to each other
                if(password !== user.device.secret) {return callback(null, false)}
                return callback(null, user)
            })
        })
    )
};

module.exports.digest_authentication = function(user_type) {
    switch (user_type) {
        case 'retailer':
            return passport.authenticate('retailer-digest',{session: false })
            break;
        case 'user':
            return passport.authenticate('user-digest',{session: false })
            break;
        case 'user-test':
            return passport.authenticate('user-test',{session: false })
            break;
        default:
            throw new Error("No user type passed in to digest authentication")
    }
}
