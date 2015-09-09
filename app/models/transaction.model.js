/**
 * Created by priyav on 09/09/15.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


var Transaction_Schema = new Schema({
   from: {
       type: String
   } ,
    to: {
        type: String
    },
    timestamp: {
        type: String
    },
    amount: {
        value: {
            type: String
        },
        currency: {
            type: String
        }
    },
    transaction_hash: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    direction: {
        type: String
    }
});

mongoose.model('Transaction', Transaction_Schema);