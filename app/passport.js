/**
 * Created by priyav on 13/08/15.
 */
var passport = require('passport'),
    Strategy = require('passport-http').DigestStrategy,
    mongoose = require('mongoose'),
    Retailer = mongoose.model('Retailer');

module.exports.initialize = function() {
    passport.use(new Strategy({qop: 'oauth'}, function(username, callback){
        Retailer.findOne({_id: username}, function(err, retailer) {
            // If retailer doesn't have id then return no matching _id
            if (err) return callback(err);
            if(!retailer) return callback(null, false);
            return callback(null, retailer, retailer.secret)
        })
    }));
}

module.exports.digest_authentication = function() {
    return passport.authenticate('digest',{session: false });
}
