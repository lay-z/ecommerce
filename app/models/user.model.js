/**
 * Created by priyav on 17/07/15.
 */
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Ripple_Account = mongoose.model('Ripple_Account'),
    Ripple_Account_Schema = Ripple_Account.schema,
    mongoose_error_handler = require('./mongoose_error_handling').error_descriptor,
    crypto = require('crypto');

// Password must be greater than 6 chars
var validatePassword = function(password) {
    return password.length > 5;
};

var UserSchema = new Schema({
    first_name: {
        type: String,
        trim: true,
        required: "first_name is required"
    },
    surname:{
        type: String,
        trim: true,
        required: "surname is required"
    },
    phone_number: {
        type: String,
        trim: true,
        required: "email address is required",
        unique: true,
        match: [/^\d+$/, 'Please fill valid number']
    },
    pin: {
        type: String,
        default: '',
        validate: [validatePassword, 'Pin should be longer']
    },
    salt: {
        type: String
    },
    ripple_account: [Ripple_Account_Schema],
});

UserSchema.pre('save', function(next) {
    // If the user
    if (this.pin && this.pin.length > 5) {
        this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
        this.pin = this.hashPin(this.pin);
    }

    next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPin = function(pin) {
    if (this.salt && pin) {
        return crypto.pbkdf2Sync(pin, this.salt, 10000, 64).toString('base64');
    } else {
        return pin;
    }
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function(pin) {
    return this.pin === this.hashPin(pin);
};

UserSchema.statics.save_user_and_wallet = function(user, wallet, callback) {
    var user = new User(user);

    // Update the User to also include pointer to ripple wallet
    user.ripple_account.push(wallet);

    // Check if User email address already exists before continue
    check_if_number_exists(user.phone_number, function(err){
        if (err) return callback(err);

        user.save(function (err) {
            if (err) {
                var e = mongoose_error_handler(err);
                return callback(e);
            }
            callback();
        });
    });
};


// Creates a constructor created from schema definitions (for UserSchema)
// Which allows us to produce instances (documents) that these models represent
// Can re-access this model when connecting to database later: use
// mongoose.model('User')
var User = mongoose.model('User', UserSchema);

// Checks if document exists with phone_number in the system, if it does
// Pass in an error into callback else
var check_if_number_exists = function (number, callback) {
    User.findOne({phone_number: number}, function(err, data){
        if(err) return callback(err);
        // If data there exists number
        if(data) {
            return callback({
                success: false,
                error: {
                    message: "number already in system",
                    fields: {
                        number: data.phone_number
                    }
                }
            });
        } else { // If no data found then no number
            callback(null);
        }
    });
};

