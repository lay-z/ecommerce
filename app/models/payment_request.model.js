/**
 * Created by priyav on 20/08/15.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var supported_currencies = function(cur) {
    // checks if curr (3 letter currency code) is in list of supported currencies
    return ["KSH"].indexOf(cur) >= 0;
};

var supported_values = function(value) {
    value = value.split('.');
    var decimalPlace = true;

    if (!(value.length === 1)) {
        var right_precision = value[1].length < 3
        var only_one_decimal = value.length < 3;
        if(!(right_precision && only_one_decimal)) {
            return false;
        }
    }

    // check for only digits
    function check_digits(arr) {
        for (number in arr) {
            for (digit in arr[number]) {
                if (isNaN(arr[number][digit])) {
                    return false;
                }
            }
        }
        return true;
    }
    return check_digits(value) && decimalPlace;
};

var Payment_Request_Schema = {
    customer_number: {
        type: String,
        required: "Payer phone_number required"
    },
    amount: {
        value: {
            type: String,
            required: "Amount does not exist",
            validate: [supported_values, "value formatting is wrong, please have precision set to two decimal places with no commas"]
        },
        currency: {
            type: String,
            validate: [supported_currencies, "Currency not supported"]
        }
    },
    description: {
        type: String,
        required: "No description provided"
    },
    retailer: {
        type: Schema.Types.ObjectId
    },
    business_name: {
        type: String,
        required: "No company name provided"
    },
    proof_of_payment: {
        type: String,
        default: null
    }
};

mongoose.model("Payment_Request", Payment_Request_Schema);

