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
    salt: {
        type: String
    },
    ripple_account: [Ripple_Account_Schema],
});

UserSchema.methods.generate_salt = function() {
    // Creates a new salt and saves it to the user
    this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
};

UserSchema.methods.encryptSecret = function(pin) {
    // Create key using combination of pin and salt
    var key = new Buffer(crypto.pbkdf2Sync(pin, this.salt, 4096, 128, 'sha256'), 'utf8')

    // Create cipher and encrypt to be held in base64
    var cipher = crypto.createCipher('aes128', key)
    var crypted = cipher.update(this.ripple_account[0].secret,'utf8','base64')
    crypted += cipher.final('base64');

    this.ripple_account[0].secret = crypted;
};

UserSchema.methods.decryptSecret = function(pin) {

    // Create key using combination of pin and salt
    var key = new Buffer(crypto.pbkdf2Sync(pin, this.salt, 4096, 128, 'sha256'), 'utf8')

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

UserSchema.statics.save_user_and_wallet = function(user, wallet, callback) {
    var pin = user.pin;
    var user = new User(user);

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

