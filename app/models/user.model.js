/**
 * Created by priyav on 17/07/15.
 */
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Ripple_Account = mongoose.model('Ripple_Account');

// Password must be greater than 6 chars
var validatePassword = function(password) {
    return password.length > 6;
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
    email: {
        type: String,
        trim: true,
        required: "email address is required",
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        default: '',
        validate: [validatePassword, 'Password should be longer']
    },
    ripple_account: {
        //TODO decide if only one ripple account per user, and if ripple accounts need to be unique
        type: Schema.ObjectId,
        ref: 'Ripple_Account'
    },
    paypal_account: {
        type:String,
        default:'',
        match: [/.+\@.+\..+/, 'Please fill a valid paypal email address']
    },
    tel_number: {
        type: String,
        required: "tel_number is required"
    }
});

UserSchema.methods.authenticate = function (password) {
    return password == this.password;
};

UserSchema.statics.save_user_and_wallet = function(user, wallet, callback) {
    var user = new User(user);
    var wallet = new Ripple_Account(wallet);

    // Check if User email address already exists before continue
    check_if_email_exists(user.email, function(err){
        if (err) return callback(err);


        // Update the User to also include pointer to ripple wallet
        user.ripple_account = wallet._id;

        user.save(function (err) {
            if (err) {
                var e = create_error_object(err);
                return callback(e);
            }
            wallet.save(function (err) {
                if (err) return callback(err);
                callback();
            });
        });
    });
};


// Creates a constructor created from schema definitions (for UserSchema)
// Which allows us to produce instances (documents) that these models represent
// Can re-access this model when connecting to database later: use
// conn.model('User')
var User = mongoose.model('User', UserSchema);

// Takes in mongoose error argument and returns error descriptor
var create_error_object = function(err) {
    //console.log(err);
    var objKeys = Object.keys(err.errors);
    var fields = {};
    var member;

    // Construct object with fields and information on field
    for(var i in objKeys) {
        member = objKeys[i];
        fields[member] = err.errors[member].message;
    }

    return {
        success: false,
        error: {
            message: err.message,
            fields: fields
        }
    }
};

// Checks if document exists with email address, if it does
// Pass in an error into callback else
var check_if_email_exists = function (email, callback) {
    User.findOne({email: email}, function(err, data){
        if(err) return callback(err);
        // If data there exists email
        if(data) {
            return callback({
                success: false,
                error: {
                    message: "email address already in system",
                    fields: {
                        email: data.email
                    }
                }
            });
        } else { // If no data found then no email address
            callback(null);
        }
    });
};

