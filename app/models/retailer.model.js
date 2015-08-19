/**
 * Created by priyav on 19/08/15.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Ripple_Account_Schema = Ripple_Account.schema,
    crypto = require('crypto');

var Retailer_Schema = new Schema({
    business_name: {
        type: String,
        trim: true,
        required: "business_name is required"
    },
    salt: {
        type: String
    },
    ripple_address: {
        type: String,
        required: "no ripple address provided"
    },
    secret: {
        type: Sring
    }
});


Retailer_Schema.pre('save', function(next) {
    // Generate secret on saving retailer to disk
    this.secret = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
    next();
});

var Retailer = mongoose.model('Retailer', Retailer_Schema);
