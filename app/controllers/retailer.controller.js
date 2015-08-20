/**
 * Created by priyav on 19/08/15.
 */
var mongoose = require("mongoose"),
    mongoose_error_handler = require('../models/mongoose_error_handling').error_descriptor,
    Retailer = mongoose.model("Retailer"),
    Ripple_Account = mongoose.model("Ripple_Account"),
    Payment_Request = mongoose.model("Payment_Request");

module.exports.save_retailer = function(req, res) {
    if (!req.body) return res.sendStatus(400);

    // First check if retailer ripple account exists
    var retailer_ripple = new Ripple_Account({
        address: req.body.ripple_address
    });

    retailer_ripple.get_balances(function(err, body) {
        console.log(body)
        if (err || !body.success) return res.status(400).json({
            success: false,
            message: "Ripple_Address invalid"
        });

        // Save the retailer
        var retailer = new Retailer(req.body);
        retailer.save(function (err) {
            if (err) return res.status(400).json(mongoose_error_handler(err));

            res.json({
                success: true,
                secret: retailer.secret,
                id: retailer._id
            });
        })
    });
};

module.exports.submit_request = function(req, res) {
    var payment_request = new Payment_Request(req.body);
    var retailer = req.user;

    // Make sure that user addressed exists
    User.findOne({phone_number: payment_request.customer_number}, function(err, user) {
        if(err) return res.status(500).json({
            success: false,
            message: "Something went wrong at the server"
        });
        if(!user) return res.status(400).json( {
            success: false,
            message: "customer_number is not registered to this service"
        })

        // Add extra details try save it to disk
        payment_request.retailer = retailer._id;
        payment_request.business_name = retailer.business_name;
        payment_request.save(function(err) {
            if(err) return res.status(500).json(mongoose_error_handler(err))

            res.json({
                success: true,
                request_id: payment_request._id
            })
        })
    })
};

module.exports.get_payment_requests = function(req, res) {
    var no_requests = {success:false, message: "No requests have been made yet"};

    // Returns array of all request objects that have been made by retailer
    var retailer = req.user;

    Payment_Request.find( { retailer: retailer._id }, "-__v -retailer", function(err, requests) {
        if(err || (requests.length === 0)) return res.status(400).json(no_requests);

        res.json({
            success: true,
            requests: requests
        })
    })
};

module.exports.get_payment_request = function(req, res) {
    var no_requests = {success:false, message: "Request id: " + req.params.id +" does not exist or cannot be accessed by this user"};

    // Returns array of all request objects that have been made by retailer
    var retailer = req.user;
    var request_id = req.params.id;

    Payment_Request.find({ retailer: retailer._id, _id: request_id }
        ,"-__v -retailer", function(err, requests) {
            if(err || (requests.length === 0)) return res.status(400).json(no_requests);

            res.json({
                success: true,
                requests: requests
            })
        })
}