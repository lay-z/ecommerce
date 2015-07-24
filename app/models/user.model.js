/**
 * Created by priyav on 17/07/15.
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

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


// Creates a constructor created from schema definitions (for UserSchema)
// Which allows us to produce instances (documents) that these models represent
// Can re-access this model when connecting to database later: use
// conn.model('User')
var User = mongoose.model('User', UserSchema);
