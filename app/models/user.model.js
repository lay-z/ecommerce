/**
 * Created by priyav on 17/07/15.
 */
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Ripple_Account = mongoose.model('Ripple_Account'),
    Ripple_Account_Schema = Ripple_Account.schema,
    mongoose_error_handler = require('./mongoose_error_handling').error_descriptor,
    crypto = require('crypto'),
    config = require('../../config/config'),
    parallel = require('async').parallel;



var UserSchema = new Schema({
    first_name: {
        type: String,
        trim: true,
        required: "First name is required"
    },
    surname:{
        type: String,
        trim: true,
        required: "Surname is required"
    },
    phone_number: {
        type: String,
        trim: true,
        required: "Phone number is required",
        unique: true,
        match: [/^\d+$/, 'Phone number invalid, please use only digits']
    },
    salt: {
        type: String
    },
    ripple_account: [Ripple_Account_Schema],
    device: {
        id: {
            type: String
        },
        secret: {
            type: String
        }
    }
});

UserSchema.methods.generate_salt = function() {
    // Creates a new salt and saves it to the user
    var salt = new Buffer(crypto.randomBytes(128).toString('base64'));

    // encrypt the salt before updating the User
    var cipher = crypto.createCipher('aes128', config.global_key)
    var crypted = cipher.update(salt,'base64','base64')
    crypted += cipher.final('base64');
    this.salt = crypted;
};

UserSchema.methods.generateAndSave_deviceIDsecret = function() {
    // Creates new device IDs and secrets
    this.device.id = new Buffer(crypto.randomBytes(128).toString('base64'));
    this.device.secret = new Buffer(crypto.randomBytes(128).toString('base64'));
};

UserSchema.methods.encryptSecret = function(pin) {
    // decrypt the salt
    var decipherPin = crypto.createDecipher('aes128', config.global_key)
    var decryptedPin = decipherPin.update(this.salt,'base64','base64')
    decryptedPin += decipherPin.final('base64');

    // Create key using combination of pin and salt
    var key = new Buffer(crypto.pbkdf2Sync(pin, decryptedPin, 64, 128, 'sha256'), 'utf8')

    // Create cipher and encrypt to be held in base64
    var cipher = crypto.createCipher('aes128', key)
    var crypted = cipher.update(this.ripple_account[0].secret,'utf8','base64')
    crypted += cipher.final('base64');

    this.ripple_account[0].secret = crypted;
};

UserSchema.methods.decryptSecret = function(pin) {
    // Decrypts ripple secret using pin
    // If pin incorrect returns false

    // decrypt the salt
    var decipherPin = crypto.createDecipher('aes128', config.global_key)
    var decryptedPin = decipherPin.update(this.salt,'base64','base64')
    decryptedPin += decipherPin.final('base64');


    // Create key using combination of pin and salt
    var key = new Buffer(crypto.pbkdf2Sync(pin, decryptedPin, 64, 128, 'sha256'), 'utf8')

    // Create cipher and encrypt to be held in base64
    var decipher = crypto.createDecipher('aes128', key)
    try {
        var decrypted = decipher.update(this.ripple_account[0].secret,'base64','utf8')
        decrypted += decipher.final('utf8');
    } catch(error) {
        return false
    }
    this.ripple_account[0].secret = decrypted;
    return true;
}

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function(pin) {
    return this.pin === this.hashPin(pin);
};

var validatePassword = function(pin) {
// pin must be greater than 6 chars and all numbers
    return /^\d+$/.test(pin) && pin.length > 5;
};

UserSchema.statics.save_user_and_wallet = function(user, wallet, callback) {
    var pin = user.pin;
    var user = new User(user);

    // Validate pin
    if(!validatePassword(pin)) {
        return callback({
            success: false,
            message: "Pin can only be digits and must be 6 digits or longer"
        })
    }

    // Update the User to also include pointer to ripple wallet
    user.ripple_account.push(wallet);

    // Check if User email address already exists before continue
    check_if_number_exists(user.phone_number, function(err){

        if (err) return callback(err);
        //console.log(user.ripple_account[0].secret);
        // Create a salt
        user.generate_salt();

        // Encrypt ripple_secret using pin
        user.encryptSecret(pin);

        user.save(function (err) {
            if (err) {
                var e = mongoose_error_handler(err);
                return callback(e);
            }
            //console.log(user.ripple_account[0].secret);
            callback();
        });
    });
};

UserSchema.methods.find_transaction = function(callback) {
    // Finds all the Ripple transactions the users ripple account has been involved
    // With, then updates transactions so show phone_numbers instead of
    // Ripple accounts.
    var self = this;
    self.ripple_account[0].previous_transactions(function(success, transactions){
        if(!success) {
            return callback(false)
        }
        User
    })


}


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
                message: "number already in system: " + data.phone_number,
            });
        } else { // If no data found then no number
            callback(null);
        }
    });
};

var update_transaction = function (transaction, callback) {

    User.find({"ripple_account.0.address": transaction.from}, function(err, document) {
        if(err || !document) return callback(false)

    } )
}

