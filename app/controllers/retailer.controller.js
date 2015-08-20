/**
 * Created by priyav on 19/08/15.
 */
var mongoose = require("mongoose"),
    mongoose_error_handler = require('../models/mongoose_error_handling').error_descriptor,
    Retailer = mongoose.model("Retailer"),
    Ripple_Account = mongoose.model("Ripple_Account");

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