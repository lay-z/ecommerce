/**
 * Created by priyav on 13/08/15.
 */
var passport = require('passport'),
    Strategy = require('passport-http').DigestStrategy,
    mongoose = require('mongoose'),
    Retailer = mongoose.model('Retailer');

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
};

module.exports.digest_authentication = function(retailer) {
    var toreturn;
    retailer ?
        toreturn = passport.authenticate('retailer-digest',{session: false })
        :
        toreturn = passport.authenticate('user-digest', {session:false})
    return toreturn
}
